# Unified API Gateway & Health Monitor
## Phase Breakdown

> **9 phases total** — Frontend first (Phases 0–2), then Backend (Phases 3–6), then full integration (Phase 7).
> Each phase must pass its own checklist before moving forward.

---

## Table of Contents

- [Phase 0 — Project Setup & Scaffolding](#phase-0--project-setup--scaffolding)
- [Phase 1 — Frontend: React App Setup + Service Registry UI](#phase-1--frontend-react-app-setup--service-registry-ui)
- [Phase 2 — Frontend: Live Dashboard + WebSocket Integration](#phase-2--frontend-live-dashboard--websocket-integration)
- [Phase 3 — Frontend: Charts, Analytics & Reports](#phase-3--frontend-charts-analytics--reports)
- [Phase 4 — Backend: Core Foundation (FastAPI + DB)](#phase-4--backend-core-foundation-fastapi--db)
- [Phase 5 — Backend: Monitoring Engine (Scheduler + Polling)](#phase-5--backend-monitoring-engine-scheduler--polling)
- [Phase 6 — Backend: Alerting System](#phase-6--backend-alerting-system)
- [Phase 7 — Integration, Testing & Deployment](#phase-7--integration-testing--deployment)
- [Risks & Mitigations](#risks--mitigations)
- [Future Enhancements](#future-enhancements)

---

## Phase 0 — Project Setup & Scaffolding
**Day 1 · Foundation**

### Goal
Stand up both the backend and frontend skeletons so every phase that follows has a clean, working base to build on. No real features yet — just folder structure, dependencies installed, and a confirmed "hello world" from both sides.

### Backend Tasks

- Create the root project folder with separate `backend/` and `frontend/` directories.
- Set up a Python virtual environment inside `backend/`.
- Install core dependencies:
  ```
  fastapi uvicorn sqlalchemy aiosqlite httpx apscheduler python-dotenv pydantic
  ```
- Create `main.py` with a single health route that returns `{"status": "ok"}` with HTTP 200.
- Create `database.py` — SQLAlchemy engine pointing to a local `monitor.db` SQLite file.
- Create `.env` for all secrets and config (DB path, JWT secret, Slack webhook, SMTP creds).
- Add `.env` to `.gitignore`. Create `.env.example` with placeholder values.

```
backend/
├── main.py
├── database.py
├── models.py          ← empty for now
├── schemas.py         ← empty for now
├── scheduler.py       ← empty for now
├── ws_manager.py      ← empty for now
├── alerting.py        ← empty for now
├── routers/
│   ├── services.py    ← empty for now
│   ├── metrics.py     ← empty for now
│   └── alerts.py      ← empty for now
├── .env
├── .env.example
└── requirements.txt
```

### Frontend Tasks

- Scaffold a new React project using Vite:
  ```bash
  npm create vite@latest frontend -- --template react
  cd frontend && npm install
  ```
- Install all dependencies upfront:
  ```bash
  npm install axios react-router-dom recharts dayjs
  ```
- Configure the Vite dev proxy so API calls to `/api` route to `http://localhost:8000` without CORS issues.
- Create placeholder files for all three main pages with minimal content (just a heading):
  - `src/pages/Dashboard.jsx`
  - `src/pages/ServiceDetail.jsx`
  - `src/pages/AlertsPage.jsx`
- Set up React Router with routes pointing to each placeholder page.
- Create the folder structure upfront:

```
frontend/src/
├── pages/
│   ├── Dashboard.jsx
│   ├── ServiceDetail.jsx
│   └── AlertsPage.jsx
├── components/
│   ├── StatusCard.jsx     ← empty for now
│   ├── LatencyChart.jsx   ← empty for now
│   ├── UptimeBadge.jsx    ← empty for now
│   ├── AlertBanner.jsx    ← empty for now
│   ├── NavBar.jsx         ← empty for now
│   └── FilterBar.jsx      ← empty for now
├── hooks/
│   ├── useWebSocket.js    ← empty for now
│   ├── useMetrics.js      ← empty for now
│   └── useServices.js     ← empty for now
└── api/
    ├── client.js          ← empty for now
    ├── services.js        ← empty for now
    ├── metrics.js         ← empty for now
    └── alerts.js          ← empty for now
```

### Phase 0 Checklist

- [ ] Backend runs locally and returns `{"status": "ok"}` on `GET /health`
- [ ] Frontend dev server runs at `localhost:5173` and shows placeholder pages
- [ ] Navigation between all three placeholder pages works
- [ ] Dev proxy is configured — `/api/*` routes to the backend without CORS errors
- [ ] `.env` is loaded, `.gitignore` is set, `.env.example` is documented

---

## Phase 1 — Frontend: React App Setup + Service Registry UI
**Days 2–3 · API client layer + Service Registry page**

### Goal
Build the API client layer and the Service Registry page — a form to register services and a table to manage them. This phase uses **mock/hardcoded data** for now since the backend isn't built yet. Focus is on getting the UI structure, components, and API call pattern right.

### What to Build

**API Client Layer**

Create a configured Axios instance with the backend base URL. Add an auth token interceptor so credentials are sent on every request. Create clean wrapper functions per domain:

```js
// api/client.js
import axios from 'axios';

const client = axios.create({ baseURL: '/api' });

client.interceptors.request.use(config => {
  const token = sessionStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default client;
```

```js
// api/services.js
import client from './client';

export const getServices = (params) => client.get('/services', { params });
export const createService = (data) => client.post('/services', data);
export const updateService = (id, data) => client.put(`/services/${id}`, data);
export const deleteService = (id) => client.delete(`/services/${id}`);
```

**Navigation Shell (`NavBar.jsx`)**
- Top navbar with links to Dashboard, Service Registry, and Alerts pages.
- Placeholder notification bell with a static badge count of `0` (wired up in Phase 2).
- Active link highlighting using React Router's `useLocation`.

**Filter Bar (`FilterBar.jsx`)**
- Dropdown filters for `environment` (prod / staging / dev) and `owner_team`.
- Accepts an `onChange` callback — parent page handles the filter state.
- Client-side filtering — no re-fetch needed.

**Service Registry Page**

Two sections on the same page:

*Section 1 — Register Service Form:*
- Fields: Name, Base URL, Health Path, Polling Interval (seconds), SLA Threshold (ms), Owner Team, Environment.
- Validation: required fields, URL format check, interval minimum of 10s.
- On submit → call `createService()` → refresh the service list → show a success toast.

*Section 2 — Services Table:*
- Columns: Name, Team, Environment, Base URL, SLA Threshold, Interval, Status (placeholder — "—"), Actions.
- Inline **Edit** button → opens the same form pre-filled with service data.
- **Deactivate** button → calls `deleteService()` → removes the row from the list.
- Apply `FilterBar` above the table.

**Shared Utility Components**

- `UptimeBadge.jsx` — renders a colour-coded pill: green (≥99%), yellow (≥95%), red (<95%).
- `StatusIndicator` helper — maps `"healthy"` / `"degraded"` / `"down"` → CSS colour class.
- `formatTimestamp` utility — formats ISO timestamps to human-readable relative time.

> **Note on mock data:** Since the backend isn't ready, initialise the services list with 3–4 hardcoded mock services so the UI is testable. Replace with real API calls once Phase 4 is done.

### Phase 1 Checklist

- [ ] NavBar renders on all pages with working navigation and active link highlight
- [ ] Service registration form validates inputs and shows errors inline
- [ ] Submitting the form adds a new entry to the services table (mock state for now)
- [ ] Edit action pre-fills the form with selected service data
- [ ] Deactivate action removes the service from the table
- [ ] Filter controls hide/show services by environment and team without a re-fetch
- [ ] `UptimeBadge` renders the correct colour for all three uptime ranges

---

## Phase 2 — Frontend: Live Dashboard + WebSocket Integration
**Days 4–5 · Status cards + real-time updates + notification bell**

### Goal
Build the main dashboard — a live grid of status cards, one per registered service. Wire up the WebSocket hook so cards update in real time without page refresh. Connect the notification bell to incoming alert events.

### What to Build

**WebSocket Hook (`hooks/useWebSocket.js`)**

A reusable hook that manages the entire WebSocket lifecycle:

```js
// hooks/useWebSocket.js
import { useEffect, useRef, useCallback } from 'react';

export function useWebSocket(url, onMessage) {
  const ws = useRef(null);
  const retryDelay = useRef(1000);

  const connect = useCallback(() => {
    ws.current = new WebSocket(url);

    ws.current.onmessage = (e) => onMessage(JSON.parse(e.data));

    ws.current.onclose = () => {
      setTimeout(() => {
        retryDelay.current = Math.min(retryDelay.current * 2, 30000);
        connect();
      }, retryDelay.current);
    };

    ws.current.onopen = () => { retryDelay.current = 1000; };
  }, [url, onMessage]);

  useEffect(() => {
    connect();
    return () => ws.current?.close();
  }, [connect]);
}
```

Reconnection schedule: `1s → 2s → 4s → 8s → 16s → 30s (capped)`.

**Status Card Component (`StatusCard.jsx`)**

Displays one service. Shows:
- Service name and owner team
- Status indicator dot: 🟢 healthy / 🟡 degraded / 🔴 down
- Current latency in ms (or "—" if down)
- Uptime % badge using `UptimeBadge`
- Last checked timestamp

Clicking the card navigates to `ServiceDetail` for that service.

Card border/background colour reflects status — red border for down, yellow for degraded, green for healthy.

**Dashboard Page (`Dashboard.jsx`)**

```
┌─────────────────────────────────────────────────┐
│  FilterBar (environment · team)                  │
├──────────┬──────────┬──────────┬────────────────┤
│ ●auth    │ ●payments│ ●orders  │ ●inventory     │
│ 142ms    │ DOWN     │ 89ms     │ 1340ms ⚠       │
│ 99.8%    │ —        │ 99.9%    │ 97.2%          │
├──────────┴──────────┴──────────┴────────────────┤
│  (more cards...)                                │
└─────────────────────────────────────────────────┘
```

- Load all services from the API on mount (use mock data until Phase 4).
- Render a responsive card grid — 4 columns on desktop, 2 on tablet, 1 on mobile.
- Connect to WebSocket (`ws://localhost:8000/ws/live`).
- On incoming `STATUS_UPDATE` message → find the matching service card in state by `service_id` and update it in place. No full re-render.
- On incoming `ALERT` message → increment the notification counter in NavBar.
- Apply FilterBar — client-side filter over the loaded services array.

**Notification Bell**

- In NavBar, show a red badge with the count of unread alerts.
- Clicking it opens a dropdown with recent unresolved alerts (fetched from `GET /alerts/events?is_resolved=false`).
- Clicking an alert item navigates to the Alerts page.
- Badge resets to 0 when the dropdown is opened.

> **Note on mock WebSocket:** Since the backend isn't ready yet, simulate WebSocket messages in dev using a `setInterval` that dispatches fake `STATUS_UPDATE` events to the handler. Comment it out in Phase 7 when the real WebSocket is connected.

### Phase 2 Checklist

- [ ] Dashboard renders a status card for every service in the mock list
- [ ] Status cards display correct colour for healthy / degraded / down states
- [ ] Simulated WebSocket update changes a card's status without page refresh
- [ ] Clicking a card navigates to the ServiceDetail page for that service
- [ ] Notification bell badge increments when a simulated alert message arrives
- [ ] Filter controls narrow the card grid without breaking update behaviour
- [ ] WebSocket auto-reconnects (test by simulating a connection drop in the hook)

---

## Phase 3 — Frontend: Charts, Analytics & Reports
**Days 6–7 · Latency charts + service detail + alerts management UI**

### Goal
Build the two remaining pages: the per-service detail view with a latency chart and stats summary, and the alerts management page with rule configuration and incident history. All data is still mocked — these pages will be wired to real API responses in Phase 7.

### What to Build

**Latency Chart Component (`LatencyChart.jsx`)**

A Recharts `LineChart` plotting `latency_ms` over time:

```jsx
import { LineChart, Line, XAxis, YAxis, ReferenceLine, Tooltip, ResponsiveContainer } from 'recharts';

export function LatencyChart({ data, slaThreshold, range, onRangeChange }) {
  return (
    <div>
      {/* Range selector: 1h | 6h | 24h */}
      <div className="range-selector">
        {['1h','6h','24h'].map(r => (
          <button key={r} onClick={() => onRangeChange(r)}
            className={range === r ? 'active' : ''}>{r}</button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <XAxis dataKey="timestamp" />
          <YAxis unit="ms" />
          <Tooltip />
          <ReferenceLine y={slaThreshold} stroke="orange"
            label={`SLA: ${slaThreshold}ms`} strokeDasharray="4 4" />
          <Line type="monotone" dataKey="latency_ms" dot={false}
            stroke="#3b82f6" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

Key features:
- Orange dashed **SLA threshold reference line** — immediately shows when the service was over budget.
- Time range selector (1h / 6h / 24h) — triggers a re-fetch with the selected range parameter.
- Gaps in the line where `latency_ms` is `null` (downtime periods) — visually shows outage windows.
- Tooltip on hover showing exact timestamp and latency.

**Service Detail Page (`ServiceDetail.jsx`)**

```
┌──────────────────────────────────────────────────┐
│  ← Back   auth-service   🟢 Healthy              │
├──────────────────────────────────────────────────┤
│  [Latency Chart — 24h with SLA reference line]   │
├────────┬────────┬────────┬────────┬──────────────┤
│ Status │ Uptime │ p95    │ SLA %  │ Error Rate   │
│ 🟢     │ 99.8%  │ 187ms  │ 99.1%  │ 0.2%         │
└────────┴────────┴────────┴────────┴──────────────┘
```

- Load service config and initial metric data on mount.
- Render `LatencyChart` with the loaded time-series data.
- Show a stats row below the chart: current status, uptime %, p95 latency, SLA compliance %, error rate.
- Subscribe to WebSocket updates for this specific `service_id` while the page is open — update the status stat live.
- When the time range is changed → re-fetch and re-render the chart.

**Alerts Page (`AlertsPage.jsx`)**

*Section 1 — Alert Rule Configuration:*
- Form to create a new rule:
  - Service selector (dropdown of registered services)
  - Condition type: `downtime` / `latency_threshold` / `error_rate`
  - Threshold value (ms for latency, 0–100 for error rate)
  - Consecutive failures before firing (default: 3)
  - Notification channel: `slack` / `email` / `both`
- On submit → call `POST /alerts/rules` → refresh the rules table.
- Table of existing rules with columns: Service, Condition, Threshold, Failures, Channel, Status.
- Deactivate button per rule row.

*Section 2 — Incident History:*
- Table of all past alert events:
  - Columns: Service, Condition, Triggered At, Resolved At, MTTR, Status
  - 🔴 Active alerts (no resolved time) highlighted in red rows
  - ⚪ Resolved alerts in normal rows
- Filter by service and resolution status.
- MTTR displayed as `Xm Ys` format (e.g. `4m 32s`).

> **Note:** Use mock incident data (4–5 hardcoded events, mix of active and resolved) until Phase 7 wires this to real API responses.

### Phase 3 Checklist

- [ ] Service detail page renders a latency chart with mock time-series data
- [ ] SLA threshold reference line is visible as a dashed orange line on the chart
- [ ] Changing the time range selector re-renders the chart with different mock data
- [ ] Stats row below the chart shows all 5 metrics correctly
- [ ] Alerts page shows the rule creation form with all fields and validation
- [ ] Submitting the form adds a new row to the rules table (mock state)
- [ ] Incident history table shows active and resolved rows colour-coded correctly
- [ ] MTTR is calculated and displayed correctly from mock `triggered_at` / `resolved_at` values

---

## Phase 4 — Backend: Core Foundation (FastAPI + DB)
**Days 8–9 · Data models + Service Registry API**

### Goal
Define the full database schema and build the service registry API — the endpoints the frontend Service Registry page will call. By the end of this phase the frontend form actually talks to a real database.

### What to Build

**Database Models (`models.py`)**

Define all four SQLAlchemy ORM models and create the tables on startup:

```python
# models.py (structure)
class Service(Base):
    __tablename__ = "services"
    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    name = Column(String(100), unique=True, nullable=False)
    base_url = Column(String(500), nullable=False)
    health_path = Column(String(200), default="/health")
    interval_seconds = Column(Integer, default=30)
    sla_threshold_ms = Column(Integer, default=1000)
    owner_team = Column(String(100))
    environment = Column(String(20))   # prod | staging | dev
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class HealthCheck(Base):
    __tablename__ = "health_checks"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    service_id = Column(String, ForeignKey("services.id"), nullable=False)
    timestamp = Column(DateTime, index=True, default=datetime.utcnow)
    status_code = Column(Integer, nullable=True)
    latency_ms = Column(Float, nullable=True)
    is_up = Column(Boolean, nullable=False)
    error_msg = Column(Text, nullable=True)

class AlertRule(Base):
    __tablename__ = "alert_rules"
    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    service_id = Column(String, ForeignKey("services.id"))
    condition_type = Column(String(30))   # downtime | latency_threshold | error_rate
    threshold = Column(Float, nullable=True)
    consecutive_failures = Column(Integer, default=3)
    channel = Column(String(20))          # slack | email | both
    is_active = Column(Boolean, default=True)

class AlertEvent(Base):
    __tablename__ = "alert_events"
    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    rule_id = Column(String, ForeignKey("alert_rules.id"))
    service_id = Column(String, ForeignKey("services.id"))
    triggered_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    is_resolved = Column(Boolean, default=False)
    message = Column(Text)
```

Create a composite index on `health_checks (service_id, timestamp)` for fast time-series queries.

**Pydantic Schemas (`schemas.py`)**

For each model, define three schema classes:
- `ServiceCreate` — required fields only for POST body
- `ServiceUpdate` — all fields `Optional` for PATCH/PUT body
- `ServiceResponse` — full model including `id`, `created_at` for API responses

**Service Registry Router (`routers/services.py`)**

```
POST   /services          → validate input, save to DB, return ServiceResponse
GET    /services          → list all active, filter by ?environment= and ?team=
GET    /services/{id}     → single service, 404 if not found or inactive
PUT    /services/{id}     → partial update, return updated ServiceResponse
DELETE /services/{id}     → set is_active=False, cancel scheduler job (stub for now)
```

**App Setup (`main.py`)**

- Register all routers with prefix `/api`.
- Enable CORS for `http://localhost:5173` (Vite dev server).
- Add the lifespan hook (empty for now — scheduler starts here in Phase 5).
- Call `Base.metadata.create_all(engine)` on startup.

**Enable WAL Mode**

```python
# database.py — add after engine creation
from sqlalchemy import event

@event.listens_for(engine, "connect")
def set_wal_mode(dbapi_conn, _):
    dbapi_conn.execute("PRAGMA journal_mode=WAL")
```

### Phase 4 Checklist

- [ ] All four database tables created on startup, confirmed via SQLite browser or CLI
- [ ] `POST /services` creates a service and returns it with a generated ID
- [ ] `GET /services` returns all active services, filters by environment and team correctly
- [ ] `GET /services/{id}` returns 404 for an unknown ID
- [ ] `PUT /services/{id}` applies partial updates without wiping other fields
- [ ] `DELETE /services/{id}` soft-deletes — service gone from list but still in DB
- [ ] `/docs` shows all endpoints with correct request/response schemas
- [ ] Frontend Service Registry page successfully creates a service via the real API

---

## Phase 5 — Backend: Monitoring Engine (Scheduler + Polling)
**Days 10–11 · Background polling + WebSocket push**

### Goal
Build the core monitoring engine — the background scheduler that polls every registered service on its configured interval, writes results to the database, and pushes status changes to the frontend in real time via WebSocket.

### What to Build

**WebSocket Manager (`ws_manager.py`)**

```python
# ws_manager.py
from fastapi import WebSocket
from typing import List

class ConnectionManager:
    def __init__(self):
        self.active: List[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        self.active.remove(ws)

    async def broadcast(self, payload: dict):
        for ws in self.active:
            try:
                await ws.send_json(payload)
            except Exception:
                pass   # stale connection — will be cleaned up on next disconnect event

ws_manager = ConnectionManager()
```

Add the WebSocket endpoint to `main.py`:

```python
@app.websocket("/ws/live")
async def websocket_endpoint(ws: WebSocket):
    await ws_manager.connect(ws)
    try:
        while True:
            await ws.receive_text()   # keep alive
    except WebSocketDisconnect:
        ws_manager.disconnect(ws)
```

**Poll Function (`scheduler.py` — `poll_service()`)**

The unit of work executed per service per interval:

```python
async def poll_service(service_id: str):
    db = SessionLocal()
    try:
        service = db.query(Service).filter(Service.id == service_id,
                                           Service.is_active == True).first()
        if not service:
            return

        url = f"{service.base_url}{service.health_path}"
        start = time.monotonic()

        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(url, timeout=10.0)
            latency_ms = (time.monotonic() - start) * 1000
            is_up = resp.status_code < 400 and latency_ms <= service.sla_threshold_ms
            status_code = resp.status_code
            error_msg = None
            status = "healthy" if (resp.status_code < 400 and latency_ms <= service.sla_threshold_ms) \
                     else "degraded" if resp.status_code < 400 else "down"
        except Exception as e:
            latency_ms = None
            is_up = False
            status_code = None
            error_msg = str(e)
            status = "down"

        # Write to DB
        check = HealthCheck(service_id=service_id, status_code=status_code,
                            latency_ms=latency_ms, is_up=is_up, error_msg=error_msg)
        db.add(check)
        db.commit()

        # Broadcast to dashboard
        await ws_manager.broadcast({
            "type": "STATUS_UPDATE",
            "service_id": service_id,
            "service_name": service.name,
            "status": status,
            "latency_ms": latency_ms,
            "is_up": is_up,
            "timestamp": datetime.utcnow().isoformat()
        })

        # Evaluate alert rules (Phase 6)
        await evaluate_alert_rules(service_id, status, latency_ms, db)

    finally:
        db.close()
```

**Scheduler Setup**

```python
# scheduler.py
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore

scheduler = AsyncIOScheduler(
    jobstores={"default": SQLAlchemyJobStore(url="sqlite:///monitor.db")}
)

def start_scheduler(db):
    scheduler.start()
    services = db.query(Service).filter(Service.is_active == True).all()
    for svc in services:
        schedule_service(svc)

def schedule_service(service):
    scheduler.add_job(
        poll_service, 'interval',
        seconds=service.interval_seconds,
        args=[service.id],
        id=f"poll_{service.id}",
        replace_existing=True
    )

def unschedule_service(service_id):
    try:
        scheduler.remove_job(f"poll_{service_id}")
    except Exception:
        pass
```

- Start the scheduler inside the `@asynccontextmanager` lifespan in `main.py`.
- Call `schedule_service()` when `POST /services` creates a new service.
- Call `schedule_service()` again when `PUT /services/{id}` changes `interval_seconds`.
- Call `unschedule_service()` when `DELETE /services/{id}` deactivates a service.

**Metrics Router (`routers/metrics.py`)**

```
GET /metrics/{id}            → time-series data, ?range=1h|6h|24h|7d
GET /metrics/{id}/percentiles → p50, p95, p99 latency for the service
GET /metrics/summary          → uptime %, p95 latency, SLA compliance, error rate
                                for all services, ?period=24h|7d|30d
```

Uptime formula: `successful_polls / total_polls * 100`
SLA compliance: `polls_within_threshold / total_polls * 100`
Error rate: `failed_polls / total_polls * 100`

### Phase 5 Checklist

- [ ] Scheduler starts on app startup and polls all registered services
- [ ] Health check records appear in `health_checks` table after each interval
- [ ] A timeout or connection error on a service is recorded as `is_up=False` — no crash
- [ ] Registering a new service via the API immediately starts polling it
- [ ] Deactivating a service stops its polling job
- [ ] WebSocket broadcasts a `STATUS_UPDATE` payload after each poll
- [ ] Frontend Dashboard cards update live when a service status changes
- [ ] Metrics endpoint returns real time-series data — frontend chart populates with it
- [ ] Remove the mock WebSocket simulation from the frontend — replace with real connection

---

## Phase 6 — Backend: Alerting System
**Days 12–13 · Rules engine + notifications + auto-resolution**

### Goal
Add the alerting layer on top of the monitoring engine. Users configure rules per service. After each poll, the system evaluates those rules and dispatches notifications when thresholds are breached. Alerts auto-resolve when the service recovers.

### What to Build

**Alert Rules Router (`routers/alerts.py`)**

```
POST   /alerts/rules         → create a new alert rule
GET    /alerts/rules         → list all rules, ?service_id=uuid to filter
PUT    /alerts/rules/{id}    → update threshold, channel, etc.
DELETE /alerts/rules/{id}    → soft-deactivate

GET    /alerts/events        → list alert events
                               ?service_id=, ?is_resolved=, ?from_date=, ?to_date=
```

**Rule Evaluation Engine (`alerting.py` — `evaluate_alert_rules()`)**

Called at the end of every `poll_service()` execution:

```python
async def evaluate_alert_rules(service_id, current_status, latency_ms, db):
    rules = db.query(AlertRule).filter(
        AlertRule.service_id == service_id,
        AlertRule.is_active == True
    ).all()

    for rule in rules:
        condition_met = False

        if rule.condition_type == "downtime":
            condition_met = (current_status == "down")
        elif rule.condition_type == "latency_threshold":
            condition_met = (latency_ms is not None and latency_ms > rule.threshold)
        elif rule.condition_type == "error_rate":
            # compute error rate over last N polls
            condition_met = compute_error_rate(service_id, db) > rule.threshold

        if condition_met:
            rule._consecutive_count = getattr(rule, '_consecutive_count', 0) + 1
            if rule._consecutive_count >= rule.consecutive_failures:
                await maybe_fire_alert(rule, service_id, latency_ms, db)
        else:
            rule._consecutive_count = 0
            await maybe_resolve_alert(rule, service_id, db)
```

**Alert Firing with Suppression**

```python
async def maybe_fire_alert(rule, service_id, value, db):
    # Check for already-active unresolved alert for this rule
    existing = db.query(AlertEvent).filter(
        AlertEvent.rule_id == rule.id,
        AlertEvent.is_resolved == False
    ).first()

    if existing:
        return   # suppress — already firing, don't spam

    # Create new alert event
    event = AlertEvent(
        rule_id=rule.id, service_id=service_id,
        message=f"{rule.condition_type} threshold breached: value={value}"
    )
    db.add(event)
    db.commit()

    # Dispatch notifications (non-blocking — failures must not crash the poller)
    asyncio.create_task(dispatch_notification(rule, event, "fired"))

    # Broadcast to frontend via WebSocket
    await ws_manager.broadcast({"type": "ALERT", "service_id": service_id, ...})
```

**Auto-Resolution**

```python
async def maybe_resolve_alert(rule, service_id, db):
    active_event = db.query(AlertEvent).filter(
        AlertEvent.rule_id == rule.id,
        AlertEvent.is_resolved == False
    ).first()

    if active_event:
        active_event.is_resolved = True
        active_event.resolved_at = datetime.utcnow()
        db.commit()
        asyncio.create_task(dispatch_notification(rule, active_event, "resolved"))
```

**Notification Dispatch (`dispatch_slack()`, `dispatch_email()`)**

```python
async def dispatch_notification(rule, event, event_type):
    try:
        if rule.channel in ("slack", "both"):
            await dispatch_slack(rule, event, event_type)
        if rule.channel in ("email", "both"):
            await dispatch_email(rule, event, event_type)
    except Exception as e:
        logging.error(f"Notification dispatch failed: {e}")
        # Swallow — never let this crash the scheduler
```

Slack payload:
```json
{
  "text": "🔴 *auth-service* is DOWN\nCondition: downtime\nTriggered: 2026-08-14T10:30:00Z\nDashboard: http://localhost:3000"
}
```

Recovery notification changes the emoji to 🟢 and includes MTTR.

**Wire Frontend to Real Alert APIs**

- Replace mock incident data in `AlertsPage` with real `GET /alerts/events` calls.
- Replace mock rules table with real `GET /alerts/rules` calls.
- Wire the rule creation form to `POST /alerts/rules`.

### Phase 6 Checklist

- [ ] Alert rule can be created via the API and retrieved correctly
- [ ] Stopping a test service creates an `AlertEvent` after K consecutive failed polls
- [ ] Slack/email notification is received when the alert fires
- [ ] No duplicate notifications during a sustained outage (suppression working)
- [ ] Restarting the service resolves the alert and sends a recovery notification
- [ ] Frontend Alerts page shows real rules and real incident history from the API
- [ ] MTTR is computed correctly from `triggered_at` and `resolved_at`

---

## Phase 7 — Integration, Testing & Deployment
**Day 14 · Package + QA + documentation**

### Goal
Package the full platform so it runs with a single `docker-compose up`. Run a complete end-to-end incident scenario to verify every layer works together. Polish the UI and write the README.

### What to Build

**Backend Dockerfile**

```dockerfile
# backend/Dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Frontend Dockerfile (multi-stage)**

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

**Nginx Config (`frontend/nginx.conf`)**

```nginx
server {
  listen 80;

  location / {
    root /usr/share/nginx/html;
    try_files $uri /index.html;    # SPA routing
  }

  location /api/ {
    proxy_pass http://backend:8000/api/;
  }

  location /ws/ {
    proxy_pass http://backend:8000/ws/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

**Docker Compose**

```yaml
# docker-compose.yml
version: '3.9'

services:
  backend:
    build: ./backend
    env_file: .env
    volumes:
      - ./data:/app/data      # persist SQLite DB across restarts
    ports:
      - "8000:8000"
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
    restart: unless-stopped
```

**End-to-End Incident Test**

Run this scenario manually before calling Phase 7 done:

1. `docker-compose up` — confirm both services start cleanly.
2. Open `http://localhost:3000` — confirm Dashboard loads.
3. Register 3 test services (two healthy endpoints, one that will be killed).
4. Confirm all 3 show 🟢 healthy on the Dashboard.
5. Configure an alert rule on the third service: `downtime`, `consecutive_failures=2`, `channel=slack`.
6. Kill / break the third service's health endpoint.
7. Within 2 poll cycles → confirm:
   - Card turns 🔴 on the Dashboard in real time
   - Alert event appears in the Alerts page incident history
   - Slack notification received
8. Restore the third service.
9. Within 2 poll cycles → confirm:
   - Card turns 🟢 in real time
   - Alert event shows `resolved_at` timestamp
   - Recovery Slack notification received
10. Open Service Detail for any service → confirm latency chart shows the downtime gap.
11. Check uptime % dropped and then recovered in the stats row.

**UI Polish**

- Add loading skeletons (or spinners) for all data fetches — no blank screens.
- Add an empty state component when no services are registered.
- Friendly error banner if the API is unreachable ("Backend offline — retrying...").
- Mobile layout audit — all pages usable at 768px width.
- Page titles (`<title>`) reflect the current page for browser tabs.

**README**

```markdown
## Quick Start

### Local dev
cd backend && pip install -r requirements.txt
cp .env.example .env   # fill in your Slack webhook + SMTP creds
uvicorn main:app --reload

cd frontend && npm install && npm run dev

### Docker
docker-compose up
# → frontend: http://localhost:3000
# → API docs: http://localhost:8000/docs

## Environment Variables
| Variable           | Description                      | Example                        |
|--------------------|----------------------------------|--------------------------------|
| DATABASE_URL       | SQLAlchemy DB connection string  | sqlite:///./data/monitor.db    |
| JWT_SECRET         | Secret key for JWT signing       | your-secret-here               |
| SLACK_WEBHOOK_URL  | Incoming webhook for Slack alerts| https://hooks.slack.com/...    |
| SMTP_HOST          | Email server host                | smtp.gmail.com                 |
| SMTP_PORT          | Email server port                | 587                            |
| SMTP_USER          | SMTP username / email address    | alerts@yourcompany.com         |
| SMTP_PASS          | SMTP password / app password     | ••••••••                       |
| CORS_ORIGIN        | Frontend origin for CORS         | http://localhost:3000          |
```

### Phase 7 Checklist

- [ ] `docker-compose up` starts the full platform with zero manual steps
- [ ] End-to-end incident simulation passes all 11 steps cleanly
- [ ] Slack notifications received for both alert fire and recovery
- [ ] Downtime gap visible in the latency chart after the incident
- [ ] All pages have loading states — no blank screens during data fetches
- [ ] Dashboard, ServiceDetail, and AlertsPage render correctly at 768px
- [ ] README is clear enough for someone new to run the project from scratch

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| **SQLite write contention under high poll frequency** | Medium — writes may queue with >100 services at short intervals | Enable WAL mode (`PRAGMA journal_mode=WAL`). Plan PostgreSQL migration for >200 services — only a `DATABASE_URL` change needed. |
| **False positive alerts from transient network blips** | High — alert fatigue erodes trust in the system | `consecutive_failures` threshold (default 3) prevents single-poll failures from firing. Configurable per rule. |
| **WebSocket reconnection storm on server restart** | Medium — all clients reconnect simultaneously, spiking load | Exponential backoff with jitter in `useWebSocket` hook staggers client reconnections. |
| **Service returns 200 but is functionally broken** | Medium — appears healthy while actually degraded | Document the requirement: `/health` endpoints must check DB connectivity and key dependencies — not just return 200. |
| **`health_checks` table query degradation over time** | Medium — queries slow down after months of accumulated data | Composite index on `(service_id, timestamp)`. Schedule a daily cleanup job to delete records older than 90 days. |
| **SMTP credentials in `.env` committed to git** | High — credential leak | Enforce `.env` in `.gitignore`. Provide `.env.example` with placeholder values only. Call it out explicitly in the README. |
| **Notification dispatch failure crashing the poller** | High — monitoring stops silently | Wrap all dispatch calls in `try/except`. Log the error. Never raise from a notification function. |

---

## Future Enhancements

### Short-Term (Next Iteration)

- **Role-based access control** — team members can only register and manage their own services. Admins see everything.
- **Dependency mapping** — define that Service B depends on Service A. Visualise cascade failure chains as a DAG on the dashboard.
- **PagerDuty integration** — escalate high-severity alerts to the on-call engineer automatically.
- **Custom health check scripts** — support `POST` requests with a JSON body for services that require authenticated health probes.

### Medium-Term

- **TimescaleDB migration** — drop-in replacement for PostgreSQL with automatic time-series partitioning and continuous aggregates. Enables sub-second queries over months of data.
- **Anomaly detection** — rolling z-score flags latency anomalies without requiring manual threshold configuration. Surface "something changed" even when SLA is not breached.
- **Prometheus metrics endpoint** — `GET /metrics/prometheus` for teams that already use Grafana. Makes this platform a data source, not just a standalone tool.
- **Multi-region agents** — deploy lightweight polling workers in multiple data centres. Aggregate results centrally. Distinguish "our region is down" from "the service is globally down."

### Long-Term

- **Synthetic monitoring** — scripted user journeys (login → search → checkout) monitored end-to-end, not just a `/health` ping.
- **AI-assisted root cause suggestion** — pattern matching over historical incidents to surface probable causes ("last 3 times auth-service went down, a deployment happened within 10 minutes").
- **Public status page** — a read-only, unauthenticated view at `/status` for communicating service health to external customers without exposing the full dashboard.

---

*Unified API Gateway & Health Monitor · Phase Breakdown v1.0 · August 2026*
