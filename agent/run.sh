#!/bin/bash
export GEMINI_API_KEY="${GEMINI_API_KEY:-}"
cd "$(dirname "$0")"

if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt -q
python -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
