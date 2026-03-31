import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateCodeChanges(description: string, repoContext: string) {
  const model = "gemini-3.1-pro-preview";
  
  const prompt = `
    You are an expert software engineer. Based on the following description of a code change and the repository context, generate the necessary file changes.
    
    Description: ${description}
    
    Repository Context (File list and some content):
    ${repoContext}
    
    Return a JSON array of objects, where each object has:
    - path: The relative path to the file.
    - content: The full new content of the file.
    - action: "create" or "update".
    
    Only include files that need to be changed.
    Provide a concise summary of the changes for a Pull Request description.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          files: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                path: { type: Type.STRING },
                content: { type: Type.STRING },
                action: { type: Type.STRING, enum: ["create", "update"] }
              },
              required: ["path", "content", "action"]
            }
          },
          summary: { type: Type.STRING }
        },
        required: ["files", "summary"]
      }
    }
  });

  return JSON.parse(response.text);
}
