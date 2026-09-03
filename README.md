# Unified API Gateway & Health Monitor

A modern, full-stack application designed to monitor the health, uptime, and latency of your microservices in real-time. It provides a service registry, automated background polling, live WebSocket updates, and comprehensive metrics tracking.

## 🚀 Features

- **Service Registry**: Add, edit, and manage services with customizable health endpoints and SLAs.
- **Live Dashboard**: Real-time status cards (Healthy 🟢, Degraded 🟡, Down 🔴) powered by WebSockets. No page refreshing required.
- **Background Polling**: An intelligent background scheduler built on `APScheduler` that checks service health at configurable intervals.
- **Latency Analytics**: Interactive time-series charts visualizing latency trends and SLA threshold breaches over 1h, 6h, and 24h ranges.
- **Alerting Engine**: Configurable alert rules (Downtime, Latency Spikes, Error Rates) that can hook into external channels like Slack or Email *(Phase 6 feature)*.

## 🛠️ Tech Stack

**Frontend**
- React 18 + Vite
- React Router (Navigation)
- Recharts (Data Visualization)
- Axios (HTTP Client)
- Vanilla CSS (Glassmorphism & modern design)

**Backend**
- Python 3 + FastAPI
- SQLAlchemy + SQLite (WAL mode enabled for concurrent writes)
- APScheduler (Background task processing)
- WebSockets (Real-time broadcasting)

## 📁 Project Structure

```text
Unigateway/
├── backend/                  # FastAPI Application
│   ├── main.py               # API & WebSocket entry point
│   ├── models.py             # Database Schema
│   ├── scheduler.py          # APScheduler Background Poller
│   ├── ws_manager.py         # WebSocket connection manager
│   ├── routers/              # API Endpoints (services, metrics, alerts)
│   └── monitor.db            # SQLite Database
├── frontend/                 # React Application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Dashboard, Registry, Details
│   │   ├── hooks/            # Custom hooks (e.g., useWebSocket)
│   │   └── api/              # Axios API integrations
├── run.ps1                   # One-click startup script
└── phase_breakdown.md        # Technical specs & roadmap
```

## 🏃‍♂️ Quick Start

### Local Development
```bash
# Backend
cd backend
pip install -r requirements.txt
# (Create a .env file based on the Environment Variables section below)
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

### Docker (Recommended)
You can launch the entire stack with a single command:
```bash
docker-compose up --build -d
```
- **Frontend Dashboard**: `http://localhost:3000`
- **Backend API Docs**: `http://localhost:8000/docs`

## ⚙️ Environment Variables
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
