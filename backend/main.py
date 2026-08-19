from fastapi import FastAPI

app = FastAPI(title="Unified API Gateway & Health Monitor")

@app.get("/health")
def health_check():
    return {"status": "ok"}
