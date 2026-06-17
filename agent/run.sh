#!/bin/bash
cd "$(dirname "$0")"

set -a; source ../.env 2>/dev/null; set +a

PYTHON=/nix/store/3lll9y925zz9393sa59h653xik66srjb-python3-3.13.9/bin/python3
export LD_LIBRARY_PATH=/nix/store/55byk2fn6548ni8ibgd2dyzpmk4z180w-gcc-12.2.0-lib/lib:$LD_LIBRARY_PATH

if [ ! -d "venv" ]; then
    $PYTHON -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt -q
$PYTHON -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
