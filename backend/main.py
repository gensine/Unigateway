from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import services

# Create database tables if they don't exist
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Unified API Gateway & Health Monitor")

# Configure CORS for the frontend React app (running on Vite dev server)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the services router under the /api prefix
app.include_router(services.router, prefix="/api/services", tags=["services"])

@app.get("/health")
def health_check():
    return {"status": "ok"}
