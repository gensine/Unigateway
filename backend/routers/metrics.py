from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from database import get_db
import models

router = APIRouter()

@router.get("/summary")
def get_metrics_summary(period: str = Query("24h"), db: Session = Depends(get_db)):
    hours = int(period.replace("h", "")) if "h" in period else 24
    if "d" in period:
        hours = int(period.replace("d", "")) * 24
    
    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
    
    total_polls = db.query(models.HealthCheck).filter(models.HealthCheck.timestamp >= cutoff).count()
    if total_polls == 0:
        return {"uptime_pct": 0, "sla_compliance_pct": 0, "error_rate_pct": 0}
        
    successful_polls = db.query(models.HealthCheck).filter(
        models.HealthCheck.timestamp >= cutoff,
        models.HealthCheck.status != "down"
    ).count()
    
    failed_polls = db.query(models.HealthCheck).filter(
        models.HealthCheck.timestamp >= cutoff,
        models.HealthCheck.status == "down"
    ).count()
    
    healthy_polls = db.query(models.HealthCheck).filter(
        models.HealthCheck.timestamp >= cutoff,
        models.HealthCheck.status == "healthy"
    ).count()
    
    return {
        "uptime_pct": round(successful_polls / total_polls * 100, 2),
        "sla_compliance_pct": round(healthy_polls / total_polls * 100, 2),
        "error_rate_pct": round(failed_polls / total_polls * 100, 2)
    }

@router.get("/{service_id}")
def get_service_metrics(service_id: int, range: str = Query("24h"), db: Session = Depends(get_db)):
    hours = int(range.replace("h", "")) if "h" in range else 24
    if "d" in range:
        hours = int(range.replace("d", "")) * 24
        
    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
    
    checks = db.query(models.HealthCheck).filter(
        models.HealthCheck.service_id == service_id,
        models.HealthCheck.timestamp >= cutoff
    ).order_by(models.HealthCheck.timestamp.asc()).all()
    
    return [
        {
            "timestamp": c.timestamp.replace(tzinfo=timezone.utc).isoformat(),
            "latency_ms": c.latency_ms if c.status != "down" else None,
            "status": c.status
        } for c in checks
    ]
    
@router.get("/{service_id}/percentiles")
def get_service_percentiles(service_id: int, db: Session = Depends(get_db)):
    checks = db.query(models.HealthCheck.latency_ms).filter(
        models.HealthCheck.service_id == service_id,
        models.HealthCheck.status != "down",
        models.HealthCheck.latency_ms != None
    ).all()
    
    latencies = sorted([c[0] for c in checks])
    if not latencies:
        return {"p50": 0, "p95": 0, "p99": 0}
        
    def percentile(p):
        idx = int((p / 100.0) * len(latencies))
        if idx >= len(latencies):
            idx = len(latencies) - 1
        return latencies[idx]
        
    return {
        "p50": percentile(50),
        "p95": percentile(95),
        "p99": percentile(99)
    }
