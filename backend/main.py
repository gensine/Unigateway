from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import engine, Base, SessionLocal
from routers import services, metrics
from ws_manager import ws_manager
from scheduler import start_scheduler, scheduler

# Create database tables if they don't exist
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start the scheduler
    db = SessionLocal()
    try:
        start_scheduler(db)
    finally:
        db.close()
    yield
    # Shutdown: Stop the scheduler
    if scheduler.running:
        scheduler.shutdown()

app = FastAPI(title="Unified API Gateway & Health Monitor", lifespan=lifespan)

# Configure CORS for the frontend React app (running on Vite dev server)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the routers under the /api prefix
app.include_router(services.router, prefix="/api/services", tags=["services"])
app.include_router(metrics.router, prefix="/api/metrics", tags=["metrics"])

@app.websocket("/ws/live")
async def websocket_endpoint(ws: WebSocket):
    await ws_manager.connect(ws)
    try:
        while True:
            await ws.receive_text()   # keep alive
    except WebSocketDisconnect:
        ws_manager.disconnect(ws)

@app.get("/health")
def health_check():
    return {"status": "ok"}
