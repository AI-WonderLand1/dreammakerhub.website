import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";

interface Props {
  laws: string;
}

export const CodeGenerator: React.FC<Props> = ({ laws }) => {
  const [description, setDescription] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [loading, setLoading] = useState(false);

  const generateCode = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `
        You are an expert AI code generator. Generate a code snippet based on the following description, while strictly adhering to the "Project Laws".

        Project Laws:
        ${laws}

        Description:
        ${description}

        Return only the code snippet.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
      });
      
      setGeneratedCode(response.text || '');
    } catch (error) {
      console.error("Code generation failed:", error);
      setGeneratedCode("Error generating code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-sm font-bold text-white">Code Generator</h3>
      <textarea 
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe the code you want to generate..."
        className="w-full h-32 bg-black/30 text-white p-3 rounded-lg text-xs font-mono"
      />
      <button 
        onClick={generateCode}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-blue-500 disabled:opacity-50"
      >
        {loading ? 'Generating...' : 'Generate Code'}
      </button>

      {generatedCode && (
        <div className="bg-black/40 p-3 rounded-lg mt-4">
          <pre className="text-xs font-mono text-green-400 overflow-x-auto whitespace-pre-wrap">
            {generatedCode}
          </pre>
        </div>
      )}
    </div>
  );
};
