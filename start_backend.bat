@echo off
echo Starting backend server...
python -m uvicorn backend.src.main:app --host 127.0.0.1 --port 8000
pause