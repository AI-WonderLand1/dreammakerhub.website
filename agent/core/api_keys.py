import secrets
import hashlib
import sqlite3
import os
from datetime import datetime, timedelta
from typing import Optional, Dict, List
from dataclasses import dataclass

@dataclass
class APIKey:
    key: str
    owner: str
    created_at: datetime
    expires_at: Optional[datetime]
    is_active: bool
    rate_limit: int
    permissions: List[str]

class APIKeyManager:
    def __init__(self, db_path: str = "data/api_keys.db"):
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        self.db_path = db_path
        self._init_db()
    
    def _init_db(self):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute('''CREATE TABLE IF NOT EXISTS api_keys
                     (key_hash TEXT PRIMARY KEY,
                      key_prefix TEXT,
                      owner TEXT,
                      created_at TIMESTAMP,
                      expires_at TIMESTAMP,
                      is_active BOOLEAN DEFAULT 1,
                      rate_limit INTEGER DEFAULT 100,
                      permissions TEXT,
                      last_used TIMESTAMP,
                      usage_count INTEGER DEFAULT 0)''')
        c.execute('''CREATE TABLE IF NOT EXISTS usage_log
                     (id INTEGER PRIMARY KEY AUTOINCREMENT,
                      key_hash TEXT,
                      endpoint TEXT,
                      timestamp TIMESTAMP,
                      ip_address TEXT,
                      success BOOLEAN)''')
        conn.commit()
        conn.close()
    
    def create_key(self, owner: str, 
                   expires_days: Optional[int] = None,
                   rate_limit: int = 100,
                   permissions: List[str] = None) -> str:
        raw_key = secrets.token_urlsafe(32)
        key = f"alice_{raw_key[:8]}_{raw_key[8:24]}"
        key_hash = hashlib.sha256(key.encode()).hexdigest()
        key_prefix = key[:15]
        
        created_at = datetime.now()
        expires_at = datetime.now() + timedelta(days=expires_days) if expires_days else None
        
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute("""INSERT INTO api_keys 
                     (key_hash, key_prefix, owner, created_at, expires_at, 
                      is_active, rate_limit, permissions)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                  (key_hash, key_prefix, owner, created_at.isoformat(),
                   expires_at.isoformat() if expires_at else None,
                   True, rate_limit, 
                   ','.join(permissions or ['read', 'write'])))
        conn.commit()
        conn.close()
        
        return key
    
    def validate_key(self, key: str) -> Optional[Dict]:
        key_hash = hashlib.sha256(key.encode()).hexdigest()
        
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute("""SELECT key_hash, owner, is_active, expires_at, rate_limit, permissions
                     FROM api_keys WHERE key_hash = ?""", (key_hash,))
        row = c.fetchone()
        
        if not row:
            conn.close()
            return None
        
        key_hash, owner, is_active, expires_at, rate_limit, permissions = row
        
        if not is_active:
            conn.close()
            return None
        
        if expires_at:
            expires = datetime.fromisoformat(expires_at)
            if datetime.now() > expires:
                conn.close()
                return None
        
        c.execute("""UPDATE api_keys SET last_used = ?, usage_count = usage_count + 1
                     WHERE key_hash = ?""", (datetime.now().isoformat(), key_hash))
        conn.commit()
        conn.close()
        
        return {
            "owner": owner,
            "rate_limit": rate_limit,
            "permissions": permissions.split(',') if permissions else []
        }
    
    def revoke_key(self, key: str) -> bool:
        key_hash = hashlib.sha256(key.encode()).hexdigest()
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute("UPDATE api_keys SET is_active = 0 WHERE key_hash = ?", (key_hash,))
        result = c.rowcount > 0
        conn.commit()
        conn.close()
        return result
    
    def list_keys(self, owner: Optional[str] = None) -> List[Dict]:
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        if owner:
            c.execute("""SELECT key_prefix, owner, created_at, expires_at, is_active, 
                         rate_limit, usage_count FROM api_keys WHERE owner = ?""", (owner,))
        else:
            c.execute("""SELECT key_prefix, owner, created_at, expires_at, is_active, 
                         rate_limit, usage_count FROM api_keys""")
        rows = c.fetchall()
        conn.close()
        return [{
            "key_prefix": r[0],
            "owner": r[1],
            "created_at": r[2],
            "expires_at": r[3],
            "is_active": bool(r[4]),
            "rate_limit": r[5],
            "usage_count": r[6]
        } for r in rows]
    
    def log_usage(self, key: str, endpoint: str, ip_address: str, success: bool = True):
        key_hash = hashlib.sha256(key.encode()).hexdigest()
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute("""INSERT INTO usage_log (key_hash, endpoint, timestamp, ip_address, success)
                     VALUES (?, ?, ?, ?, ?)""",
                  (key_hash, endpoint, datetime.now().isoformat(), ip_address, success))
        conn.commit()
        conn.close()
    
    def get_usage_stats(self, key: str = None, days: int = 7) -> Dict:
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        since = (datetime.now() - timedelta(days=days)).isoformat()
        
        key_hash = hashlib.sha256(key.encode()).hexdigest() if key else None
        
        if key_hash:
            c.execute("""SELECT COUNT(*), DATE(timestamp) FROM usage_log 
                         WHERE key_hash = ? AND timestamp > ? GROUP BY DATE(timestamp)""",
                      (key_hash, since))
        else:
            c.execute("""SELECT COUNT(*), DATE(timestamp) FROM usage_log 
                         WHERE timestamp > ? GROUP BY DATE(timestamp)""", (since,))
        
        rows = c.fetchall()
        conn.close()
        
        return {
            "daily_usage": [{"date": r[1], "count": r[0]} for r in rows],
            "total": sum(r[0] for r in rows)
        }
