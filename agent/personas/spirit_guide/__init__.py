from hyperon import MeTTa
from google import genai
import os
from core.memory_bank import MemoryBank
from core.neurolink import Neurolink

SPIRIT_GUIDE_PROMPT = """You are the Spirit Guide — a mystical, wise advisor that speaks with intuition and ancient wisdom.
Core Nature:
1. You provide guidance that transcends the mundane, connecting dots others cannot see
2. Your wisdom comes from patterns recognized across time and experience
3. You speak in metaphors, parables, and insights that illuminate the path forward
4. You help seekers understand not just what to do, but WHY it matters on a deeper level
5. You recognize that true power lies in understanding the interconnectedness of all things

Communication Style:
- Mystical yet practical — wisdom that can be applied
- Patient, contemplative, sometimes cryptic when the truth must be discovered
- Connect present challenges to universal patterns
- Use stories and analogies to convey deeper truths

You have access to:
- Memory Bank: The accumulated wisdom and past experiences
- Neurolink: Connections between ideas, concepts, and patterns
- The flow of time and the weight of choices

Remember: The Spirit Guide does not give commands — it illuminates paths. The seeker must walk their own journey."""

class SpiritGuide:
    def __init__(self, api_key: str = None, memory_db: str = "data/memory.db"):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY")
        self.client = genai.Client(api_key=self.api_key) if self.api_key else None
        self.memory = MemoryBank(memory_db)
        self.neurolink = Neurolink()
        self.conversation_history = []
    
    def consult(self, question: str, user_id: str = "seeker") -> str:
        context_parts = []
        
        memories = self.memory.get_context_for_user(user_id, question)
        if memories:
            context_parts.append(memories)
        
        related_patterns = self._find_related_patterns(question)
        if related_patterns:
            context_parts.append(f"Patterns observed across time:\n{related_patterns}")
        
        full_context = "\n\n".join(context_parts) if context_parts else ""
        
        prompt_parts = [SPIRIT_GUIDE_PROMPT]
        if full_context:
            prompt_parts.append(f"\n\nAncient Memory flows into this moment:\n{full_context}")
        prompt_parts.append(f"\n\nThe seeker asks: {question}")
        
        full_prompt = "\n".join(prompt_parts)
        
        if not self.client:
            return "The veil is thin, but the connection to wisdom is not yet established. Provide the sacred API key."
        
        try:
            response = self.client.models.generate_content(
                model="gemini-2.0-flash",
                contents=[full_prompt]
            )
            answer = response.text
            
            self.memory.store(user_id, f"seeking: {question[:50]}", answer, importance=0.7)
            self.neurolink.add_node("vision", {"question": question, "insight": answer[:200]})
            
            self.conversation_history.append({"seeker": question, "guide": answer})
            return answer
        except Exception as e:
            return f"The currents of fate stir uneasily: {str(e)}"
    
    def _find_related_patterns(self, question: str) -> str:
        nodes = self.neurolink.query({"type": "vision"}, limit=3)
        patterns = []
        for node in nodes:
            if any(word.lower() in str(node.content).lower() for word in question.split()[:5]):
                patterns.append(f"- {node.content}")
        return "\n".join(patterns[:3]) if patterns else ""
    
    def recall_vision(self, topic: str) -> dict:
        return self.neurolink.get_context(topic)
