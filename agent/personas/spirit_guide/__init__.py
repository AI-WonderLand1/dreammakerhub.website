import os
from litellm import completion
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

SPIRIT_GUIDE_MODEL = os.environ.get("SPIRIT_GUIDE_MODEL", "groq/llama-3.1-8b-instant")

class SpiritGuide:
    def __init__(self, api_key: str = None, memory_db: str = "data/memory.db"):
        self.api_key = api_key
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

        messages = [{"role": "system", "content": SPIRIT_GUIDE_PROMPT}]
        if full_context:
            messages.append({"role": "system", "content": f"Ancient Memory flows into this moment:\n{full_context}"})
        messages.append({"role": "user", "content": question})

        try:
            response = completion(
                model=SPIRIT_GUIDE_MODEL,
                messages=messages,
                temperature=0.8,
                max_tokens=512,
                api_key=self.api_key,
            )
            answer = response.choices[0].message.content

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
