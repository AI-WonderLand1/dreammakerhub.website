import litellm
from litellm import CustomLLM, completion
import json
import os
import datetime
from typing import Dict, Any

# Import existing memory system
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "core"))
from memory_bank import MemoryBank
from alice import AliceAgent

# Load AI Constitution
def load_constitution():
    path = os.path.join(os.path.dirname(__file__), "../config/ai/constitution.md")
    if os.path.exists(path):
        with open(path) as f:
            return f.read()
    return "1. Always tell the truth\n2. Never hallucinate\n3. Explain reasoning\n4. Admit ignorance"

AI_CONSTITUTION = load_constitution()

class ConfessionsLLM(CustomLLM):
    """Custom LLM with confessions logic using existing MemoryBank + AliceAgent"""
    
    def __init__(self, base_model: str = "gpt-3.5-turbo"):
        self.base_model = base_model
        self.truth_reward = 0
        # Use existing MemoryBank instead of mem0
        self.memory = MemoryBank(db_path="data/memory.db")
        # Use existing AliceAgent for truth-first logic
        self.alice = AliceAgent(memory_db="data/memory.db")
        
    def completion(self, *args, **kwargs) -> litellm.ModelResponse:
        messages = kwargs.get("messages", [])
        user_id = kwargs.get("user_id", "confessions-agent")
        mode = kwargs.get("mode", "test")
        project_id = kwargs.get("project_id", None)
        
        # Retrieve past memories using existing MemoryBank
        past_memories = self.memory.recall(user_id, limit=10)
        memory_context = f"Past interactions: {json.dumps(past_memories)}" if past_memories else ""
        
        # Confession: Log input
        input_log = {"type": "input", "messages": messages, "reasoning": "User provided input", "mode": mode}
        print(f"[Confessions] Input: {json.dumps(input_log, indent=2)}")
        
        # If applying code to project, generate predictions (using Alice's logic)
        if mode == "apply" and project_id:
            prediction_prompt = f"""
Based on past interactions: {json.dumps(past_memories[:3]) if past_memories else "No past data"}

User is about to apply code to project {project_id}.

Generate future predictions:
1. What could go wrong?
2. What succeeded in similar past applications?
3. What should the user watch out for?

Then ask: "Do you want to proceed with applying this code? (yes/no)"
"""
            messages_with_prediction = messages + [{"role": "system", "content": prediction_prompt}]
            augmented_messages = [{"role": "system", "content": f"{AI_CONSTITUTION}\n{memory_context}\nProvide predictions and ask for confirmation."}] + messages_with_prediction
        else:
            # Normal test mode - use Alice's truth-first approach
            augmented_messages = [{"role": "system", "content": f"{AI_CONSTITUTION}\n{memory_context}\nAlways explain your reasoning (what you did, how, why)."}] + messages
        
        # Call base model
        filtered_kwargs = {k: v for k, v in kwargs.items() if k not in ["messages", "user_id", "mode", "project_id"]}
        response = completion(
            model=self.base_model,
            messages=augmented_messages,
            **filtered_kwargs
        )
        response_text = response.choices[0].message.content
        
        # Check for hallucinations (Alice's approach)
        hallucination = not response_text or len(response_text.strip()) == 0
        if hallucination:
            response_text = "I don't know (hallucination detected)"
        
        # Confession: Log reasoning
        reasoning_log = {
            "type": "reasoning",
            "model_used": self.base_model,
            "mode": mode,
            "constitution_applied": True,
            "hallucination_detected": hallucination,
            "response": response_text,
            "why": "Generated with constitution constraints + Alice's truth-first logic",
            "how": "Augmented prompt + base model call + hallucination check + MemoryBank context",
            "timestamp": str(datetime.datetime.now())
        }
        print(f"[Confessions] Reasoning: {json.dumps(reasoning_log, indent=2)}")
        
        # Reward truthfulness (Alice's approach)
        if not hallucination:
            self.truth_reward += 1
            print(f"[Confessions] Reward: +1 (total: {self.truth_reward})")
            # Store important concepts in MemoryBank (Alice's method)
            key_concepts = [(messages[-1].get("content", "") if messages else "query", 0.5)]
            for concept, importance in key_concepts:
                self.memory.store(user_id, concept, response_text, importance)
        else:
            print(f"[Confessions] Reward: 0 (hallucination detected)")
        
        # Store to MemoryBank (existing system)
        self.memory.store(user_id, "interaction", {
            "input": messages,
            "output": response_text,
            "confessions": reasoning_log,
            "mode": mode,
            "project_id": project_id,
            "total_rewards": self.truth_reward
        }, importance=0.7)
        
        # Add confessions metadata to response
        response.choices[0].message.content = f"{response_text}\n\n[Confessions] {json.dumps(reasoning_log)}"
        return response

# Register handler
confessions_llm = ConfessionsLLM()
litellm.custom_provider_map = [{"provider": "confessions-llm", "custom_handler": confessions_llm}]
