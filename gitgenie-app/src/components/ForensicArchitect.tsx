import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";

interface ForensicReport {
  violations: string[];
  dnaMap: string;
  rippleEffect: string;
}

interface Props {
  context: any;
  report: ForensicReport | null;
  setReport: (report: ForensicReport | null) => void;
  laws: string;
  setLaws: (laws: string) => void;
}

export const ForensicArchitect: React.FC<Props> = ({ context, report, setReport, laws, setLaws }) => {
  const [loading, setLoading] = useState(false);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `
        You are the "Forensic Architect". Analyze the following project context and "Project Laws" to identify compliance violations, map the code DNA, and predict ripple effects of changes.

        Project Laws:
        ${laws}

        Project Context:
        ${JSON.stringify(context)}

        Return a JSON object with:
        - violations: string[] (List of violations of the Project Laws)
        - dnaMap: string (Summary of how the project logic is structured)
        - rippleEffect: string (Prediction of what might break if changes are made)
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              violations: { type: Type.ARRAY, items: { type: Type.STRING } },
              dnaMap: { type: Type.STRING },
              rippleEffect: { type: Type.STRING }
            },
            required: ["violations", "dnaMap", "rippleEffect"]
          }
        }
      });
      
      const newReport = JSON.parse(response.text || '{}');
      setReport(newReport);
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-white">Project Laws</h3>
      <textarea 
        value={laws}
        onChange={(e) => setLaws(e.target.value)}
        className="w-full h-32 bg-black/30 text-white p-3 rounded-lg text-xs font-mono"
      />
      <button 
        onClick={runAnalysis}
        disabled={loading}
        className="w-full bg-purple-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-purple-500 disabled:opacity-50"
      >
        {loading ? 'Analyzing...' : 'Run Forensic Analysis'}
      </button>

      {report && (
        <div className="space-y-4 mt-4">
          <div className="bg-red-900/20 p-3 rounded-lg">
            <h4 className="text-xs font-bold text-red-400 mb-1">Violations</h4>
            {report.violations.map((v, i) => <p key={i} className="text-xs text-red-200">- {v}</p>)}
          </div>
          <div className="bg-blue-900/20 p-3 rounded-lg">
            <h4 className="text-xs font-bold text-blue-400 mb-1">DNA Map</h4>
            <p className="text-xs text-blue-200">{report.dnaMap}</p>
          </div>
          <div className="bg-yellow-900/20 p-3 rounded-lg">
            <h4 className="text-xs font-bold text-yellow-400 mb-1">Ripple Effect</h4>
            <p className="text-xs text-yellow-200">{report.rippleEffect}</p>
          </div>
        </div>
      )}
    </div>
  );
};
