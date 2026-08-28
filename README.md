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

## 🏃‍♂️ How to Run

Running the project is incredibly simple thanks to the included startup script.

### Prerequisites
- Node.js (for the frontend)
- Python 3.9+ (for the backend)

### Steps
1. Open a terminal (PowerShell) in the root `Unigateway` directory.
2. Execute the runner script:
   ```powershell
   .\run.ps1
   ```
3. A separate PowerShell window will automatically open to start the Python Backend on port `8000`.
4. Your current terminal window will start the React Frontend and automatically launch your browser to `http://localhost:5173`.

> **Note:** If PowerShell blocks the script, you may need to run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` to allow local scripts to execute.
