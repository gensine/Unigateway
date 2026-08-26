# This file defines what valid request/response data looks like
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# Shared properties
class ServiceBase(BaseModel):
    name: str
    base_url: str
    health_path: str = "/health"
    interval_seconds: int = 30
    sla_threshold_ms: int = 1000
    owner_team: str
    environment: str
    is_active: bool = True

# Properties to receive via API on creation
class ServiceCreate(ServiceBase):
    pass

# Properties to receive via API on update
class ServiceUpdate(ServiceBase):
    pass

# Properties to return via API
class ServiceResponse(ServiceBase):
    id: int
    created_at: datetime

    # For the frontend dashboard - these are populated dynamically from HealthCheck data
    status: str = "unknown"
    latency_ms: Optional[int] = None
    uptime_pct: float = 100.0
    last_checked: Optional[datetime] = None

    class Config:
        from_attributes = True
        orm_mode = True
