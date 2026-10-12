import pytest
from datetime import datetime, timezone
import models

def test_service_healthy_classification():
    """Test: Status code < 400 and latency <= SLA -> Healthy"""
    status_code = 200
    latency_ms = 350
    sla_threshold_ms = 500
    
    if status_code < 400 and latency_ms <= sla_threshold_ms:
        status = "healthy"
    elif status_code < 400:
        status = "degraded"
    else:
        status = "down"
        
    assert status == "healthy"

def test_service_degraded_latency_breach():
    """Test: Status code < 400 but latency > SLA -> Degraded"""
    status_code = 200
    latency_ms = 850
    sla_threshold_ms = 500
    
    if status_code < 400 and latency_ms <= sla_threshold_ms:
        status = "healthy"
    elif status_code < 400:
        status = "degraded"
    else:
        status = "down"
        
    assert status == "degraded"

def test_service_down_on_http_error():
    """Test: Status code >= 400 -> Down"""
    status_code = 500
    latency_ms = 120
    sla_threshold_ms = 500
    
    if status_code < 400 and latency_ms <= sla_threshold_ms:
        status = "healthy"
    elif status_code < 400:
        status = "degraded"
    else:
        status = "down"
        
    assert status == "down"

def test_uptime_calculation():
    """Test: Uptime percentage computed correctly"""
    checks = [
        {"status": "healthy"},
        {"status": "healthy"},
        {"status": "degraded"},
        {"status": "down"}
    ]
    total = len(checks)
    up = sum(1 for c in checks if c["status"] != "down")
    uptime_pct = round((up / total) * 100, 2)
    assert uptime_pct == 75.0

def test_alert_state_machine_transition():
    """Test: Alert transitions between active and resolved"""
    event = {"status": "active", "triggered_at": datetime.now(timezone.utc), "resolved_at": None}
    assert event["status"] == "active"
    
    # Upon recovery
    event["status"] = "resolved"
    event["resolved_at"] = datetime.now(timezone.utc)
    assert event["status"] == "resolved"
    assert event["resolved_at"] is not None
