from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
import httpx
import time
from datetime import datetime, timezone
from database import SessionLocal
from models import Service, HealthCheck
from ws_manager import ws_manager
from alerting import evaluate_alert_rules

scheduler = AsyncIOScheduler(
    jobstores={"default": SQLAlchemyJobStore(url="sqlite:///monitor.db")}
)

def start_scheduler(db):
    if not scheduler.running:
        scheduler.start()
    services = db.query(Service).filter(Service.is_active == True).all()
    for svc in services:
        schedule_service(svc)

def schedule_service(service: Service):
    scheduler.add_job(
        poll_service, 'interval',
        seconds=service.interval_seconds,
        args=[service.id],
        id=f"poll_{service.id}",
        replace_existing=True
    )

def unschedule_service(service_id: int):
    try:
        scheduler.remove_job(f"poll_{service_id}")
    except Exception:
        pass

async def poll_service(service_id: int):
    db = SessionLocal()
    try:
        service = db.query(Service).filter(Service.id == service_id, Service.is_active == True).first()
        if not service:
            return

        url = f"{service.base_url}{service.health_path}"
        start = time.monotonic()
        
        latency_ms = None
        status_code = None
        error_msg = None
        
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(url, timeout=10.0)
            
            latency_ms = int((time.monotonic() - start) * 1000)
            status_code = resp.status_code
            
            if status_code < 400 and latency_ms <= service.sla_threshold_ms:
                status = "healthy"
            elif status_code < 400:
                status = "degraded"
            else:
                status = "down"
                error_msg = f"HTTP {status_code}"
        except Exception as e:
            status = "down"
            error_msg = str(e)
            
        is_up = (status != "down")
            
        check = HealthCheck(
            service_id=service_id, 
            status=status,
            latency_ms=latency_ms,
            error_message=error_msg,
            timestamp=datetime.now(timezone.utc)
        )
        db.add(check)
        db.commit()
        
        # Broadcast via WebSocket
        await ws_manager.broadcast({
            "type": "STATUS_UPDATE",
            "service_id": service_id,
            "service_name": service.name,
            "status": status,
            "latency_ms": latency_ms,
            "is_up": is_up,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        await evaluate_alert_rules(service_id, status, latency_ms, db)
        
    finally:
        db.close()
