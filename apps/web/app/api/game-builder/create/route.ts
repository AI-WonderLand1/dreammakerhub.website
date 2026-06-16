import { NextRequest, NextResponse } from "next/server";
import { runModel } from "@core/ai/runModel";
<<<<<<< HEAD
import { GoogleGenerativeAI } from "@google/generative-ai";
=======
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786

export const dynamic = 'force-dynamic';
export const runtime = "nodejs";

<<<<<<< HEAD
const AI_PROVIDER = process.env.AI_PROVIDER || "opencode";

async function callOpenCode(system: string, userPrompt: string): Promise<string> {
  const result = await runModel({
    model: "opencode/big-pickle",
    messages: [
      { role: "system", content: system },
      { role: "user", content: userPrompt }
    ]
  });
  
  if (!result.text) throw new Error("Empty response from OpenCode");
  return result.text;
}

async function callGemini(system: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY or GOOGLE_API_KEY is not configured.");
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  
  const result = await model.generateContent([
    { text: system },
    { text: userPrompt },
  ]);
  
  const response = await result.response;
  const text = response.text();
  
  if (!text) throw new Error("Empty response from Gemini");
  return text;
}

=======
async function callAI(system: string, userPrompt: string): Promise<string> {
  const result = await runModel({
    model: "groq/llama-3.3-70b-versatile",
    messages: [{ role: "user", content: userPrompt }],
    system,
  });
  if (!result.text) throw new Error("Empty AI response");
  return result.text;
}

>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
const GAME_SCENE_SYSTEM = `You are an expert PlayCanvas 3D scene architect. Create complete 3D scene definitions for PlayCanvas engine.

OUTPUT FORMAT - JSON ONLY (no markdown):
{
  "name": "Scene name",
  "description": "What the scene contains",
  "objects": [
    {
      "name": "Object name",
      "type": "box|sphere|cylinder|plane|capsule|cone",
      "position": [x, y, z],
      "rotation": [x, y, z],
      "scale": [x, y, z],
      "material": {
        "color": [r, g, b],
        "metalness": 0-1,
        "roughness": 0-1,
        "emissive": [r, g, b]
      }
    }
  ],
  "lights": [
    {
      "type": "directional|point|spot",
      "color": [r, g, b],
      "intensity": 0-10,
      "position": [x, y, z],
      "direction": [x, y, z]
    }
  ],
  "camera": {
    "position": [x, y, z],
    "target": [x, y, z],
    "fov": 45
  },
  "sky": {
    "type": "color|gradient",
    "color": [r, g, b]
  }
}

Rules:
- Output valid JSON only - no markdown fences, no explanation
- Include at least 3-5 objects for interesting scenes
- Use proper PlayCanvas coordinates (Y is up)
- Describe materials realistically (metallic for metal, glossy for glass, matte for wood)
- Include appropriate lighting for the scene mood`;

function generateSceneId(): string {
  return `scene_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt?.trim()) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

<<<<<<< HEAD
    const sceneJson = AI_PROVIDER === "google"
    ? await callGemini(GAME_SCENE_SYSTEM, `Create a 3D scene for: "${prompt}". Make it interesting and detailed.`)
    : await callOpenCode(GAME_SCENE_SYSTEM, `Create a 3D scene for: "${prompt}". Make it interesting and detailed.`);
=======
    const sceneJson = await callAI(GAME_SCENE_SYSTEM, `Create a 3D scene for: "${prompt}". Make it interesting and detailed.`);
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786

    let sceneData;
    try {
      const cleaned = sceneJson
        .replace(/^```json\n?/g, "")
        .replace(/^```\n?/g, "")
        .replace(/```$/g, "")
        .trim();
      
      sceneData = JSON.parse(cleaned);
    } catch (parseError) {
      // If JSON parsing fails, create a basic scene
      sceneData = {
        name: "AI Generated Scene",
        description: prompt,
        objects: [
          {
            name: "Ground",
            type: "plane",
            position: [0, 0, 0],
            rotation: [-90, 0, 0],
            scale: [20, 20, 1],
            material: { color: [0.2, 0.2, 0.2], metalness: 0, roughness: 0.8 }
          },
          {
            name: "Main Object",
            type: "box",
            position: [0, 1, 0],
            rotation: [0, 0, 0],
            scale: [2, 2, 2],
            material: { color: [0.4, 0.6, 0.8], metalness: 0.3, roughness: 0.5 }
          }
        ],
        lights: [
          { type: "directional", color: [1, 1, 1], intensity: 1, direction: [-1, -1, -1] }
        ],
        camera: { position: [0, 5, 10], target: [0, 1, 0], fov: 45 },
        sky: { type: "color", color: [0.1, 0.1, 0.15] }
      };
    }

    const sceneId = generateSceneId();

    // Save to Supabase
    const { saveSceneToSupabase } = await import("@/lib/scene/supabase-store");
    await saveSceneToSupabase(sceneId, sceneData);

    return NextResponse.json({
      sceneId,
      scene: sceneData,
      preview: `/play/${sceneId}`
    });

  } catch (error: any) {
    console.error("Game builder error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate scene" },
      { status: 500 }
    );
  }
}