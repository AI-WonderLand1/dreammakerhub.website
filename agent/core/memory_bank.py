import json
import os
from datetime import datetime
from typing import Any, Dict, List, Optional
import sqlite3

class MemoryBank:
    def __init__(self, db_path: str = "data/memory.db"):
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        self.db_path = db_path
        self._init_db()
    
    def _init_db(self):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute('''CREATE TABLE IF NOT EXISTS memories
                     (id INTEGER PRIMARY KEY AUTOINCREMENT,
                      user_id TEXT,
                      key TEXT,
                      value TEXT,
                      embedding TEXT,
                      created_at TIMESTAMP,
                      last_accessed TIMESTAMP,
                      access_count INTEGER DEFAULT 1,
                      importance REAL DEFAULT 0.5)''')
        c.execute('''CREATE TABLE IF NOT EXISTS knowledge_bank
                     (id INTEGER PRIMARY KEY AUTOINCREMENT,
                      topic TEXT UNIQUE,
                      facts TEXT,
                      confidence REAL,
                      verified BOOLEAN)''')
        conn.commit()
        conn.close()
    
    def store(self, user_id: str, key: str, value: Any, importance: float = 0.5) -> bool:
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        now = datetime.now().isoformat()
        c.execute("""INSERT INTO memories 
                     (user_id, key, value, created_at, last_accessed, importance)
                     VALUES (?, ?, ?, ?, ?, ?)""",
                  (user_id, key, json.dumps(value), now, now, importance))
        conn.commit()
        conn.close()
        return True
    
    def recall(self, user_id: str, key: str = None, limit: int = 10) -> List[Dict]:
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        now = datetime.now().isoformat()
        if key:
            c.execute("""SELECT * FROM memories 
                         WHERE user_id = ? AND key LIKE ?
                         ORDER BY importance DESC, last_accessed DESC
                         LIMIT ?""", (user_id, f"%{key}%", limit))
        else:
            c.execute("""SELECT * FROM memories 
                         WHERE user_id = ?
                         ORDER BY importance DESC, last_accessed DESC
                         LIMIT ?""", (user_id, limit))
        rows = c.fetchall()
        memories = []
        for row in rows:
            memories.append({
                "id": row[0],
                "key": row[2],
                "value": json.loads(row[3]) if row[3] else None,
                "created_at": row[5],
                "importance": row[8]
            })
            c.execute("""UPDATE memories SET last_accessed = ?, access_count = access_count + 1
                         WHERE id = ?""", (now, row[0]))
        conn.commit()
        conn.close()
        return memories
    
    def store_fact(self, topic: str, facts: List[str], confidence: float = 1.0, verified: bool = True):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute("""INSERT OR REPLACE INTO knowledge_bank 
                     (topic, facts, confidence, verified)
                     VALUES (?, ?, ?, ?)""",
                  (topic, json.dumps(facts), confidence, verified))
        conn.commit()
        conn.close()
    
    def retrieve_facts(self, topic: str) -> Optional[Dict]:
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute("SELECT facts, confidence, verified FROM knowledge_bank WHERE topic = ?", (topic,))
        row = c.fetchone()
        conn.close()
        if row:
            return {"facts": json.loads(row[0]), "confidence": row[1], "verified": row[2]}
        return None
    
    def get_context_for_user(self, user_id: str, query: str = None) -> str:
        memories = self.recall(user_id, query, limit=5)
        if not memories:
            return ""
        context = "Relevant memories:\n"
        for m in memories:
            context += f"- {m['key']}: {m['value']}\n"
        return context
