import os
import sys

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
DATABASE_PATH = os.environ.get("DATABASE_PATH", "data/memory.db")
API_KEY_DB = os.environ.get("API_KEY_DB", "data/api_keys.db")
DEFAULT_PERMISSIONS = ["read", "write"]

def validate_config():
    if not GEMINI_API_KEY:
        print("Warning: GEMINI_API_KEY not set. AI responses will fail.")
        return False
    return True
