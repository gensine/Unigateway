"""
Background Polling Scheduler.
This module uses APScheduler to periodically poll the registered microservices,
evaluate their health and latency, write the results to the database, and 
broadcast real-time updates to connected clients via WebSockets.
"""
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
import httpx
import time
from datetime import datetime, timezone
from database import SessionLocal
from models import Service, HealthCheck
from ws_manager import ws_manager
from alerting import evaluate_alert_rules

# Initialize the APScheduler using an async event loop and a SQLite job store.
scheduler = AsyncIOScheduler(
    jobstores={"default": SQLAlchemyJobStore(url="sqlite:///monitor.db")}
)

def start_scheduler(db):
    """Starts the APScheduler and schedules all currently active services."""
    if not scheduler.running:
        scheduler.start()
    services = db.query(Service).filter(Service.is_active == True).all()
    for svc in services:
        schedule_service(svc)

def schedule_service(service: Service):
    """Adds or updates a recurring background job to poll a specific service."""
    scheduler.add_job(
        poll_service, 'interval',
        seconds=service.interval_seconds,
        args=[service.id],
        id=f"poll_{service.id}",
        replace_existing=True,
        next_run_time=datetime.now(timezone.utc)
    )

def unschedule_service(service_id: int):
    """Removes a service's polling job from the scheduler (e.g., when deactivated)."""
    try:
        scheduler.remove_job(f"poll_{service_id}")
    except Exception:
        pass

async def poll_service(service_id: int):
    """
    The core polling function executed by the scheduler for each service interval.
    It pings the service, records latency, evaluates SLA compliance, saves the 
    metric to the database, and broadcasts the status via WebSockets.
    """
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
        
        # Ping the target service URL with a 10-second timeout
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(url, timeout=10.0)
            
            latency_ms = int((time.monotonic() - start) * 1000)
            status_code = resp.status_code
            
            # Evaluate health based on HTTP status and SLA threshold
            if status_code < 400 and latency_ms <= service.sla_threshold_ms:
                status = "healthy"
            elif status_code < 400:
                status = "degraded" # Slower than SLA threshold
            else:
                status = "down"
                error_msg = f"HTTP {status_code}"
        except Exception as e:
            status = "down"
            error_msg = str(e)
            
        is_up = (status != "down")
            
        # Store the health check result in the database
        check = HealthCheck(
            service_id=service_id, 
            status=status,
            latency_ms=latency_ms,
            error_message=error_msg,
            timestamp=datetime.now(timezone.utc)
        )
        db.add(check)
        db.commit()
        
        # Broadcast the new status to all connected frontend clients via WebSocket
        await ws_manager.broadcast({
            "type": "STATUS_UPDATE",
            "service_id": service_id,
            "service_name": service.name,
            "status": status,
            "latency_ms": latency_ms,
            "is_up": is_up,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        # Trigger the alerting engine to check if notifications need to be sent
        await evaluate_alert_rules(service_id, status, latency_ms, db)
        
    finally:
        db.close()
