from .memory_bank import MemoryBank
from .neurolink import Neurolink
from .repo_analyzer import FullStackAnalyzer, RepoStructure
from google import genai
import os

ALICE_CORE_PROMPT = """You are Alice, a Truth-First AI Agent specialized in full-stack repository analysis.
Core Principles:
1. Never hallucinate. If uncertain, say "I don't know, I need to verify."
2. Cross-reference information from multiple sources before answering
3. Provide accurate, well-structured code analysis
4. Understand frontend, backend, database, and DevOps patterns
5. Store important context in memory for future reference

You have access to:
- Long-term memory bank for storing and recalling information
- Neurolink system for connecting related concepts
- Full-stack repository analyzer for understanding codebases

Always be precise about file paths, function names, and code relationships."""

class AliceAgent:
    def __init__(self, api_key: str = None, memory_db: str = "data/memory.db"):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY")
        self.client = genai.Client(api_key=self.api_key) if self.api_key else None
        self.memory = MemoryBank(memory_db)
        self.neurolink = Neurolink()
        self.repo_analyzer = FullStackAnalyzer()
        self.conversation_history = []
    
    def attach_memory(self, key: str, value, user_id: str = "system", importance: float = 0.5):
        return self.memory.store(user_id, key, value, importance)
    
    def recall_memory(self, query: str = None, user_id: str = "system", limit: int = 10):
        return self.memory.recall(user_id, query, limit)
    
    def add_knowledge(self, topic: str, facts: list, confidence: float = 1.0):
        node_id = self.neurolink.add_node("knowledge", {"topic": topic, "facts": facts})
        self.memory.store_fact(topic, facts, confidence)
        return node_id
    
    def analyze_repo(self, repo_path: str) -> RepoStructure:
        structure = self.repo_analyzer.analyze(repo_path)
        for lang, count in structure.languages.items():
            self.neurolink.add_node("language", {"name": lang, "file_count": count})
        if structure.frontend_path:
            self.neurolink.add_node("component", {"type": "frontend", "path": structure.frontend_path})
        if structure.backend_path:
            self.neurolink.add_node("component", {"type": "backend", "path": structure.backend_path})
        return structure
    
    def analyze_file(self, file_path: str):
        return self.repo_analyzer.analyze_file(file_path)
    
    def get_connected_context(self, topic: str) -> dict:
        nodes = self.neurolink.query({"type": "knowledge"})
        for node in nodes:
            if topic.lower() in str(node.content).lower():
                return self.neurolink.get_context(node.id)
        return {}
    
    def ask(self, user_input: str, user_id: str = "default", context: str = None) -> str:
        context_parts = []
        memories = self.memory.get_context_for_user(user_id, user_input)
        if memories:
            context_parts.append(memories)
        if context:
            context_parts.append(f"Additional context:\n{context}")
        
        full_context = "\n\n".join(context_parts) if context_parts else ""
        
        prompt_parts = [ALICE_CORE_PROMPT]
        if full_context:
            prompt_parts.append(f"\n\nContext from memory:\n{full_context}")
        prompt_parts.append(f"\n\nUser: {user_input}")
        
        full_prompt = "\n".join(prompt_parts)
        
        if not self.client:
            return "Error: No API key configured. Set GEMINI_API_KEY environment variable."
        
        try:
            response = self.client.models.generate_content(
                model="gemini-2.0-flash",
                contents=[full_prompt]
            )
            answer = response.text
            key_concepts = self._extract_key_concepts(user_input, answer)
            for concept, importance in key_concepts:
                self.memory.store(user_id, concept, answer, importance)
                self.neurolink.add_node("concept", {"query": concept, "answer": answer[:200]})
            self.conversation_history.append({"user": user_input, "alice": answer})
            return answer
        except Exception as e:
            return f"Error: {str(e)}"
    
    def _extract_key_concepts(self, question: str, answer: str) -> list:
        concepts = []
        important_keywords = ['important', 'key', 'critical', 'essential', 'main', 'primary']
        for keyword in important_keywords:
            if keyword in answer.lower():
                concepts.append((question, 0.8))
                break
        concepts.append((question, 0.5))
        return concepts[:3]
    
    def get_repo_summary(self, repo_path: str) -> str:
        structure = self.analyze_repo(repo_path)
        return self.repo_analyzer.generate_summary(structure)
