from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base

class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    base_url = Column(String)
    health_path = Column(String, default="/health")
    interval_seconds = Column(Integer, default=30)
    sla_threshold_ms = Column(Integer, default=1000)
    owner_team = Column(String, index=True)
    environment = Column(String, index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    health_checks = relationship("HealthCheck", back_populates="service", cascade="all, delete-orphan")
    alert_rules = relationship("AlertRule", back_populates="service", cascade="all, delete-orphan")

class HealthCheck(Base):
    __tablename__ = "health_checks"

    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("services.id"))
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    status = Column(String) # 'healthy', 'degraded', 'down'
    latency_ms = Column(Integer, nullable=True)
    error_message = Column(String, nullable=True)

    service = relationship("Service", back_populates="health_checks")

class AlertRule(Base):
    __tablename__ = "alert_rules"

    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("services.id"))
    condition = Column(String) # 'downtime', 'latency_threshold'
    threshold = Column(Integer, nullable=True)
    failures = Column(Integer, default=3)
    channel = Column(String) # 'slack', 'email'
    is_active = Column(Boolean, default=True)

    service = relationship("Service", back_populates="alert_rules")
    events = relationship("AlertEvent", back_populates="rule", cascade="all, delete-orphan")

class AlertEvent(Base):
    __tablename__ = "alert_events"

    id = Column(Integer, primary_key=True, index=True)
    rule_id = Column(Integer, ForeignKey("alert_rules.id"))
    triggered_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    resolved_at = Column(DateTime, nullable=True)
    status = Column(String) # 'active', 'resolved'
    details = Column(String)

    rule = relationship("AlertRule", back_populates="events")
