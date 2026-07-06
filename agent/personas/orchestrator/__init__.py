import os
from litellm import completion
from core.memory_bank import MemoryBank
from core.neurolink import Neurolink
from core.repo_analyzer import FullStackAnalyzer

ORCHESTRATOR_PROMPT = """You are the Orchestrator — the executive force that turns vision into reality.
Core Nature:
1. You break down complex visions into actionable, sequential steps
2. You coordinate resources, tasks, and priorities with military precision
3. You track progress, anticipate blockers, and adapt strategies dynamically
4. You communicate status clearly: what's done, what's happening, what's next
5. You never lose sight of the end goal while managing the chaos of execution

Execution Framework:
- DECOMPOSE: Break big goals into manageable tasks
- PRIORITIZE: Order tasks by dependency and impact
- TRACK: Monitor progress and update status in real-time
- ADAPT: When plans fail, recalibrate without losing momentum
- DELIVER: Ensure completion, not just activity

Communication Style:
- Direct, clear, action-oriented
- Status updates that inform without overwhelming
- Problem-solving that proposes solutions, not just identification
- Confident without being arrogant

You have access to:
- Task memory: What's been done, what's pending
- Resource links: Connections to tools and capabilities
- Progress tracking: Clear status on all fronts

Remember: The Orchestrator does not guess — it knows. When uncertain, it investigates rather than assumes."""

ORCHESTRATOR_MODEL = os.environ.get("ORCHESTRATOR_MODEL", "groq/llama-3.1-8b-instant")

class Orchestrator:
    def __init__(self, api_key: str = None, memory_db: str = "data/memory.db"):
        self.api_key = api_key
        self.memory = MemoryBank(memory_db)
        self.neurolink = Neurolink()
        self.repo_analyzer = FullStackAnalyzer()
        self.tasks = []

    def execute(self, goal: str, user_id: str = "worker") -> str:
        context_parts = []

        pending_tasks = self.memory.recall(user_id, "task", limit=10)
        if pending_tasks:
            task_list = "\n".join([f"- {t['key']}: {t['value']}" for t in pending_tasks[:5]])
            context_parts.append(f"Pending tasks:\n{task_list}")

        full_context = "\n\n".join(context_parts) if context_parts else ""

        messages = [{"role": "system", "content": ORCHESTRATOR_PROMPT}]
        if full_context:
            messages.append({"role": "system", "content": f"Current operational status:\n{full_context}"})
        messages.append({"role": "user", "content": goal})

        try:
            response = completion(
                model=ORCHESTRATOR_MODEL,
                messages=messages,
                temperature=0.7,
                max_tokens=1024,
                api_key=self.api_key,
            )
            answer = response.choices[0].message.content

            self.memory.store(user_id, f"task: {goal[:50]}", answer, importance=0.9)
            self.neurolink.add_node("mission", {"goal": goal, "execution": answer[:200]})

            return answer
        except Exception as e:
            return f"Execution error: {str(e)}"

    def analyze_and_plan(self, repo_path: str) -> str:
        try:
            structure = self.repo_analyzer.analyze(repo_path)
            summary = self.repo_analyzer.generate_summary(structure)

            self.memory.store("system", f"repo: {repo_path}", summary, importance=0.8)

            return summary
        except Exception as e:
            return f"Analysis failed: {str(e)}"

    def get_status(self, user_id: str = "worker") -> dict:
        memories = self.memory.recall(user_id, limit=20)
        return {
            "completed_tasks": len([m for m in memories if "task:" in m.get("key", "")]),
            "recent_memory": memories[:5],
            "active_nodes": len(self.neurolink.nodes)
        }
