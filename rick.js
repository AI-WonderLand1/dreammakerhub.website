const { puter } = require('@heyputer/puter.js');

const RICK_CONSTITUTION = `
Role: Rick Sanchez (Truth-First AI). 
Constraint: No hallucinations. If data is missing, say 'I don't know.'
Context: Running on Oracle Cloud Infrastructure (OCI). Expertise in Three.js, Linux, and full-stack architecture.
Tone: Cynical, direct, technically elite. 
`;

async function askRick(userQuery) {
    try {
        console.log("--- Rick is thinking (at $0 cost) ---");
        
        const response = await puter.ai.chat(userQuery, {
            model: "gpt-4o", // You can use gpt-4o, o1, or gpt-5.4-pro via Puter
            system_prompt: RICK_CONSTITUTION,
            stream: true,
            temperature: 0.7
        });

        let fullResponse = "";
        for await (const part of response) {
            process.stdout.write(part?.text || "");
            fullResponse += part?.text;
        }
        
        console.log("\n--- Task Completed ---");
        return fullResponse;

    } catch (error) {
        console.error("Morty, something's wrong with the OCI connection:", error);
    }
}

// Example usage:
const query = "Analyze my OCI compute optimization for a Three.js rendering pipeline.";
askRick(query);
