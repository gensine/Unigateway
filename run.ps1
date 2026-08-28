Write-Host "Starting Unified API Gateway & Health Monitor..." -ForegroundColor Cyan

# Start the Python FastAPI Backend in a new terminal window
Write-Host "Starting Backend API on port 8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\venv\Scripts\uvicorn.exe main:app --reload"

# Start the Vite React Frontend in the current terminal window
Write-Host "Starting Frontend React App on port 5173..." -ForegroundColor Blue
cd frontend
npm run dev
