import asyncio
import logging
import os
import httpx
import smtplib
from email.mime.text import MIMEText
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from models import AlertRule, AlertEvent, HealthCheck
from ws_manager import ws_manager

async def dispatch_slack(rule: AlertRule, event: AlertEvent, event_type: str):
    webhook_url = os.getenv("SLACK_WEBHOOK_URL")
    if not webhook_url or "T00000000" in webhook_url:
        logging.info(f"SLACK DISPATCH (SIMULATED): {event_type} - {event.details}")
        return

    payload = {
        "text": f"*{'🔴 ALERT FIRED' if event_type == 'fired' else '🟢 ALERT RESOLVED'}*\n{event.details}"
    }
    try:
        async with httpx.AsyncClient() as client:
            await client.post(webhook_url, json=payload, timeout=5.0)
        logging.info(f"SLACK NOTIFICATION SENT: {event_type}")
    except Exception as e:
        logging.error(f"Failed sending Slack webhook: {e}")

async def dispatch_email(rule: AlertRule, event: AlertEvent, event_type: str):
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", 587))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")

    if not smtp_host or smtp_user == "alerts@yourcompany.com":
        logging.info(f"EMAIL DISPATCH (SIMULATED): {event_type} - {event.details}")
        return

    msg = MIMEText(f"Alert Event {event_type.upper()}:\n{event.details}")
    msg['Subject'] = f"[Unigateway Alert] {event_type.upper()}: {event.details[:40]}"
    msg['From'] = smtp_user
    msg['To'] = smtp_user

    try:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=5) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
        logging.info(f"EMAIL SENT: {event_type}")
    except Exception as e:
        logging.error(f"Failed sending email: {e}")

async def dispatch_notification(rule: AlertRule, event: AlertEvent, event_type: str):
    try:
        if rule.channel in ("slack", "both"):
            await dispatch_slack(rule, event, event_type)
        if rule.channel in ("email", "both"):
            await dispatch_email(rule, event, event_type)
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
            value = 0
        elif rule.condition == "latency_threshold":
            checks = recent_checks[:rule.failures]
            condition_met = len(checks) == rule.failures and all(c.latency_ms is not None and c.latency_ms > rule.threshold for c in checks)
            value = latency_ms
        elif rule.condition == "error_rate":
            checks = recent_checks[:rule.failures]
            if len(checks) == rule.failures:
                failed_count = sum(1 for c in checks if c.status == "down")
                error_rate_pct = (failed_count / len(checks)) * 100.0
                condition_met = error_rate_pct >= (rule.threshold or 50.0)
                value = error_rate_pct

        if condition_met:
            await maybe_fire_alert(rule, service_id, value, db)
        else:
            if rule.condition == "downtime":
                if current_status != "down":
                    await maybe_resolve_alert(rule, service_id, db)
            elif rule.condition == "latency_threshold":
                if latency_ms is None or latency_ms <= rule.threshold:
                    await maybe_resolve_alert(rule, service_id, db)
            elif rule.condition == "error_rate":
                if current_status != "down":
                    await maybe_resolve_alert(rule, service_id, db)

