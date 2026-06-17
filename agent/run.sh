#!/bin/bash
cd "$(dirname "$0")"

set -a; source ../.env 2>/dev/null; set +a

PYTHON=/nix/store/3lll9y925zz9393sa59h653xik66srjb-python3-3.13.9/bin/python3

if [ ! -d "venv" ]; then
    $PYTHON -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt -q
python -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
