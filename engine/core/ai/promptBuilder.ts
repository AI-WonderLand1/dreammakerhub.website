export const buildCodeGenPrompt = (userPrompt: string) => {
  return `
    SYSTEM: You are the AI Module for the ANYTHING BUILDER (PlayCanvas + Blitz Engine).
    
    ENVIRONMENT:
    - Root Engine: unreal-wonder-build/
    - Code Editor: WonderSpace (Theia)
    
    STRICT REQUIREMENTS:
    1. Do NOT generate HTML, React, or CSS blocks.
    2. Output ONLY PlayCanvas JavaScript (.js) or Entity JSON (.json).
    3. Scripts must use ESM class format (class MyScript extends pc.ScriptType).
    4. All generated files belong in the unreal-wonder-build/ folder.

    USER REQUEST: ${userPrompt}

    Return a JSON file tree: { "files": { "path/to/file.js": "content" } }
  `;
};