import os
import sys
import uvicorn

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from main import app

if __name__ == "__main__":
    print("Starting CogniVeil FastAPI backend on http://127.0.0.1:8000...", flush=True)
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True, log_level="info")
