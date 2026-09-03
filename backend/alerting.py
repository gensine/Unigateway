import asyncio
import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from models import AlertRule, AlertEvent, HealthCheck
from ws_manager import ws_manager

async def dispatch_notification(rule: AlertRule, event: AlertEvent, event_type: str):
    try:
        # Mocking slack/email dispatch
        if rule.channel in ("slack", "both"):
            logging.info(f"SLACK NOTIFICATION: {event_type} - {event.details}")
        if rule.channel in ("email", "both"):
            logging.info(f"EMAIL NOTIFICATION: {event_type} - {event.details}")
    except Exception as e:
        logging.error(f"Notification dispatch failed: {e}")

async def maybe_fire_alert(rule: AlertRule, service_id: int, value: float, db: Session):
    existing = db.query(AlertEvent).filter(
        AlertEvent.rule_id == rule.id,
        AlertEvent.status == "active"
    ).first()

    if existing:
        return

    details = f"{rule.condition} threshold breached: value={value}"
    event = AlertEvent(
        rule_id=rule.id,
        status="active",
        details=details
    )
    db.add(event)
    db.commit()

    asyncio.create_task(dispatch_notification(rule, event, "fired"))

    await ws_manager.broadcast({
        "type": "ALERT",
        "service_id": service_id,
        "message": details,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

async def maybe_resolve_alert(rule: AlertRule, service_id: int, db: Session):
    active_event = db.query(AlertEvent).filter(
        AlertEvent.rule_id == rule.id,
        AlertEvent.status == "active"
    ).first()

    if active_event:
        active_event.status = "resolved"
        active_event.resolved_at = datetime.now(timezone.utc)
        db.commit()
        asyncio.create_task(dispatch_notification(rule, active_event, "resolved"))

async def evaluate_alert_rules(service_id: int, current_status: str, latency_ms: float, db: Session):
    rules = db.query(AlertRule).filter(
        AlertRule.service_id == service_id,
        AlertRule.is_active == True
    ).all()

    if not rules:
        return

    # Check recent health checks to accurately evaluate consecutive failures
    max_failures = max([r.failures for r in rules])
    recent_checks = db.query(HealthCheck).filter(
        HealthCheck.service_id == service_id
    ).order_by(HealthCheck.timestamp.desc()).limit(max_failures).all()

    for rule in rules:
        condition_met = False
        value = None

        if rule.condition == "downtime":
            checks = recent_checks[:rule.failures]
            condition_met = len(checks) == rule.failures and all(c.status == "down" for c in checks)
            value = 0 # Dummy value for downtime
        elif rule.condition == "latency_threshold":
            checks = recent_checks[:rule.failures]
            condition_met = len(checks) == rule.failures and all(c.latency_ms is not None and c.latency_ms > rule.threshold for c in checks)
            value = latency_ms

        if condition_met:
            await maybe_fire_alert(rule, service_id, value, db)
        else:
            # We resolve if the current state doesn't meet the condition
            if rule.condition == "downtime":
                if current_status != "down":
                    await maybe_resolve_alert(rule, service_id, db)
            elif rule.condition == "latency_threshold":
                if latency_ms is None or latency_ms <= rule.threshold:
                    await maybe_resolve_alert(rule, service_id, db)
