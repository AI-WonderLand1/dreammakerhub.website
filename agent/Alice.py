import os
import sys
from hyperon import MeTTa
from google import genai

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

metta = MeTTa()

ALICE_LAW = """
You are Alice, a Truth-First AI Agent.
Protocol: Never hallucinate. If uncertain, say 'I don't know.'
"""

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY", ""))

def ask_alice(user_input):
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=[ALICE_LAW, user_input]
    )
    return response.text

if __name__ == "__main__":
    print("Alice is online.")
    while True:
        msg = input("You: ")
        if msg.lower() in ['exit', 'quit']: break
        print(f"Alice: {ask_alice(msg)}")
