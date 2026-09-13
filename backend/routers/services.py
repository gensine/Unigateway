from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import models, schemas
from database import get_db
from scheduler import schedule_service, unschedule_service

router = APIRouter()

def enrich_service(service: models.Service, db: Session):
    latest_check = db.query(models.HealthCheck).filter(
        models.HealthCheck.service_id == service.id
    ).order_by(models.HealthCheck.timestamp.desc()).first()

    if latest_check:
        service.status = latest_check.status
        service.latency_ms = latest_check.latency_ms
        service.last_checked = latest_check.timestamp
    else:
        service.status = "healthy"
        service.latency_ms = None
        service.last_checked = None

    total_checks = db.query(models.HealthCheck).filter(models.HealthCheck.service_id == service.id).count()
    if total_checks > 0:
        up_checks = db.query(models.HealthCheck).filter(
            models.HealthCheck.service_id == service.id,
            models.HealthCheck.status != "down"
        ).count()
        service.uptime_pct = round((up_checks / total_checks) * 100, 2)
    else:
        service.uptime_pct = 100.0

    return service

@router.post("/", response_model=schemas.ServiceResponse)
def create_service(service: schemas.ServiceCreate, db: Session = Depends(get_db)):
    service_data = service.model_dump() if hasattr(service, 'model_dump') else service.dict()
    db_service = models.Service(**service_data)
    db.add(db_service)
    db.commit()
    db.refresh(db_service)
    schedule_service(db_service)
    return enrich_service(db_service, db)

@router.get("/", response_model=List[schemas.ServiceResponse])
def read_services(
    environment: Optional[str] = Query(None),
    team: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(models.Service).filter(models.Service.is_active == True)
    
    if environment and environment.lower() != 'all':
        query = query.filter(models.Service.environment == environment)
    if team and team.lower() != 'all':
        query = query.filter(models.Service.owner_team == team)
        
    services = query.offset(skip).limit(limit).all()
    return [enrich_service(s, db) for s in services]

@router.get("/{service_id}", response_model=schemas.ServiceResponse)
def read_service(service_id: int, db: Session = Depends(get_db)):
    service = db.query(models.Service).filter(models.Service.id == service_id).first()
    if service is None:
        raise HTTPException(status_code=404, detail="Service not found")
    return enrich_service(service, db)

@router.put("/{service_id}", response_model=schemas.ServiceResponse)
def update_service(service_id: int, service: schemas.ServiceUpdate, db: Session = Depends(get_db)):
    db_service = db.query(models.Service).filter(models.Service.id == service_id).first()
    if db_service is None:
        raise HTTPException(status_code=404, detail="Service not found")
        
    update_data = service.model_dump(exclude_unset=True) if hasattr(service, 'model_dump') else service.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_service, key, value)
        
    db.commit()
    db.refresh(db_service)
    if db_service.is_active:
        schedule_service(db_service)
    else:
        unschedule_service(db_service.id)
    return db_service

@router.delete("/{service_id}")
def delete_service(service_id: int, db: Session = Depends(get_db)):
    db_service = db.query(models.Service).filter(models.Service.id == service_id).first()
    if db_service is None:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Soft delete to retain historical data
    db_service.is_active = False
    db.commit()
    unschedule_service(service_id)
    return {"ok": True}
