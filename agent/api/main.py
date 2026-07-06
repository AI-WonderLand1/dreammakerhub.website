from typing import Optional, List, Any
import os
import sys
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from personas import SpiritGuide, Orchestrator
from core.alice import AliceAgent
from core.api_keys import APIKeyManager

DEFAULT_LLM_KEY = os.environ.get("GROQ_API_KEY") or os.environ.get("OPENROUTER_API_KEY") or os.environ.get("GEMINI_API_KEY") or ""

app = FastAPI(
    title="Wonderland Agent API",
    description="Dual-Persona AI: Spirit Guide + Orchestrator",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_key_manager = APIKeyManager()
spirit_guide = SpiritGuide(api_key=DEFAULT_LLM_KEY)
orchestrator = Orchestrator(api_key=DEFAULT_LLM_KEY)
alice_agent = AliceAgent(api_key=DEFAULT_LLM_KEY)

def get_api_key(x_api_key: str = Header(None)):
    if not x_api_key:
        raise HTTPException(status_code=401, detail="API key required")
    result = api_key_manager.validate_key(x_api_key)
    if not result:
        raise HTTPException(status_code=401, detail="Invalid or expired API key")
    return result

class SpiritGuideRequest(BaseModel):
    question: str
    user_id: Optional[str] = "seeker"

class OrchestratorRequest(BaseModel):
    goal: str
    user_id: Optional[str] = "worker"

class AskRequest(BaseModel):
    question: str
    context: Optional[str] = None
    user_id: Optional[str] = "user"

class RepoAnalyzeRequest(BaseModel):
    repo_path: str

class APIKeyCreateRequest(BaseModel):
    owner: str
    expires_days: Optional[int] = None
    rate_limit: Optional[int] = 100
    permissions: Optional[List[str]] = None

@app.get("/")
async def root():
    return {
        "name": "Wonderland Agent",
        "personas": ["spirit_guide", "orchestrator", "rick", "default"],
        "status": "online"
    }

@app.post("/api/ask")
async def ask_alice(request: AskRequest, api_info: dict = Depends(get_api_key)):
    answer = alice_agent.ask(request.question, user_id=request.user_id, context=request.context)
    return {"answer": answer}

@app.post("/api/spirit-guide/consult")
async def consult_spirit_guide(request: SpiritGuideRequest, api_info: dict = Depends(get_api_key)):
    answer = spirit_guide.consult(request.question, request.user_id or "seeker")
    return {"persona": "spirit_guide", "answer": answer}

@app.post("/api/orchestrator/execute")
async def orchestrator_execute(request: OrchestratorRequest, api_info: dict = Depends(get_api_key)):
    answer = orchestrator.execute(request.goal, request.user_id or "worker")
    return {"persona": "orchestrator", "answer": answer}

@app.post("/api/orchestrator/analyze")
async def analyze_repo(request: RepoAnalyzeRequest, api_info: dict = Depends(get_api_key)):
    try:
        summary = orchestrator.analyze_and_plan(request.repo_path)
        return {"success": True, "summary": summary}
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.get("/api/orchestrator/status")
async def get_status(user_id: str = "worker", api_info: dict = Depends(get_api_key)):
    status = orchestrator.get_status(user_id)
    return {"persona": "orchestrator", "status": status}

@app.post("/api/keys/create")
async def create_api_key(request: APIKeyCreateRequest):
    key = api_key_manager.create_key(
        owner=request.owner,
        expires_days=request.expires_days,
        rate_limit=request.rate_limit,
        permissions=request.permissions
    )
    return {"success": True, "api_key": key}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "llm_configured": bool(DEFAULT_LLM_KEY),
        "spirit_guide": "ready",
        "orchestrator": "ready",
        "alice": "ready"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

