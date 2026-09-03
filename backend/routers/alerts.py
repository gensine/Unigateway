from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models import AlertRule, AlertEvent, Service
from schemas import AlertRuleCreate, AlertRuleUpdate, AlertRuleResponse, AlertEventResponse

router = APIRouter()

@router.post("/rules", response_model=AlertRuleResponse)
def create_rule(rule: AlertRuleCreate, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == rule.service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    db_rule = AlertRule(**rule.dict())
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    return db_rule

@router.get("/rules", response_model=List[AlertRuleResponse])
def get_rules(service_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(AlertRule).filter(AlertRule.is_active == True)
    if service_id is not None:
        query = query.filter(AlertRule.service_id == service_id)
    return query.all()

@router.put("/rules/{rule_id}", response_model=AlertRuleResponse)
def update_rule(rule_id: int, rule_update: AlertRuleUpdate, db: Session = Depends(get_db)):
    db_rule = db.query(AlertRule).filter(AlertRule.id == rule_id).first()
    if not db_rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    update_data = rule_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_rule, key, value)
        
    db.commit()
    db.refresh(db_rule)
    return db_rule

@router.delete("/rules/{rule_id}")
def delete_rule(rule_id: int, db: Session = Depends(get_db)):
    db_rule = db.query(AlertRule).filter(AlertRule.id == rule_id).first()
    if not db_rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    db_rule.is_active = False
    db.commit()
    return {"status": "deleted"}

@router.get("/events", response_model=List[AlertEventResponse])
def get_events(service_id: Optional[int] = None, is_resolved: Optional[bool] = None, db: Session = Depends(get_db)):
    query = db.query(AlertEvent)
    if service_id is not None:
        query = query.join(AlertRule).filter(AlertRule.service_id == service_id)
    if is_resolved is not None:
        status = "resolved" if is_resolved else "active"
        query = query.filter(AlertEvent.status == status)
    
    return query.order_by(AlertEvent.triggered_at.desc()).all()
