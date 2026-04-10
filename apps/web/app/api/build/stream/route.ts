import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { manifestVisualBlock } from "../../../../../../engine/core/ai/bridge";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "@/lib/logger";

// Validation schema
const BuildRequestSchema = z.object({
  prompt: z.string().min(1).max(10000, "Prompt too long (max 10000 chars)"),
  type: z.enum(["website", "game", "component", "playcanvas", "wonderspace"]).default("website"),
  save: z.boolean().default(false),
  fileName: z.string().max(100).regex(/^[a-zA-Z0-9-_]+$/, "Invalid filename").optional(),
});

// Constants for safety
const MAX_STREAM_DURATION_MS = 120000; // 2 minutes max
const MAX_OUTPUT_SIZE_KB = 500; // 500KB max output

export const runtime = "nodejs";

const WEBSITE_SYSTEM = `You are an elite frontend engineer. Build a COMPLETE, visually stunning single-page website.
Rules:
- Output a FULL standalone HTML file
- Use Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
- Use vanilla JavaScript for interactivity (no frameworks)
- Include beautiful design: gradients, glassmorphism, smooth animations, modern typography
- Add real interactive elements: nav, hero, sections, buttons with hover effects
- Make it immediately impressive when opened in a browser
- Output ONLY the complete HTML — no markdown fences, no explanation

Start your output with <!DOCTYPE html>`;

const GAME_SYSTEM = `You are an expert HTML5 game developer. Build a COMPLETE, playable browser game.
Rules:
- Output a FULL standalone HTML file with embedded CSS and JavaScript
- Use HTML5 Canvas for rendering
- Include: game loop (requestAnimationFrame), keyboard/mouse input, collision detection, score display, game over screen with restart
- Add sound effects using Web Audio API
- Make the game fun, polished, and immediately playable
- Output ONLY the complete HTML — no markdown fences, no explanation

Start your output with <!DOCTYPE html>`;

const COMPONENT_SYSTEM = `You are an expert React UI engineer. Build a beautiful, interactive React component.
Rules:
- Output a FULL standalone HTML file
- Use React + ReactDOM via CDN (unpkg), Tailwind CSS via CDN, and Babel standalone for JSX
- Include realistic mock data and interactive states
- Make it visually impressive
- Output ONLY the complete HTML — no markdown fences, no explanation

Start your output with <!DOCTYPE html>`;

const PLAYCANVAS_SYSTEM = `You are an expert PlayCanvas 3D game engine developer. Write a complete, production-ready PlayCanvas script.
Rules:
- Output ONLY a JavaScript pc.Script class — no HTML, no markdown fences, no explanation
- Use pc.createScript() and proper Script API lifecycle methods
- Declare all attributes with MyScript.attributes.add() before prototype methods
- Include initialize, update (if needed), and swap methods
- Add detailed JSDoc-style comments
- Make the script immediately usable by dragging onto any PlayCanvas entity

Format:
// [Script name] — [one-line description]
var MyScript = pc.createScript('myScript');
MyScript.attributes.add('speed', { type: 'number', default: 1, title: 'Speed' });
MyScript.prototype.initialize = function() { ... };
MyScript.prototype.update = function(dt) { ... };`;

const WONDERSPACE_SYSTEM = `You are an expert TypeScript/React developer working in the WonderSpace IDE. Build clean, well-structured code.
Rules:
- Output production-quality TypeScript/React code
- Use modern React patterns: hooks, functional components, proper types
- Add JSDoc comments for all exported functions and components
- Follow the existing WonderSpace coding conventions
- Output ONLY the code — no markdown fences, no explanation`;

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY or GOOGLE_API_KEY is not configured.");
  return new GoogleGenerativeAI(apiKey);
}

async function callGemini(system: string, userPrompt: string): Promise<string> {
  const genAI = getGeminiClient();
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

function sse(event: string, data: object): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function stripCodeFences(code: string): string {
  return code
    .replace(/^```[\w]*\n?/gm, "")
    .replace(/^```\s*$/gm, "")
    .trim();
}

function getSystemPrompt(type: string): string {
  switch (type) {
    case "game":       return GAME_SYSTEM;
    case "component":  return COMPONENT_SYSTEM;
    case "playcanvas": return PLAYCANVAS_SYSTEM;
    case "wonderspace": return WONDERSPACE_SYSTEM;
    default:           return WEBSITE_SYSTEM;
  }
}

function getTypeLabel(type: string): string {
  switch (type) {
    case "game":       return "HTML5 game";
    case "component":  return "UI component";
    case "playcanvas": return "PlayCanvas script";
    case "wonderspace": return "WonderSpace module";
    default:           return "website";
  }
}

function getReviewerSystem(type: string): string {
  switch (type) {
    case "game":
      return "You are a senior game developer. Review this HTML5 game. Fix bugs, improve game feel, ensure all input works. Return ONLY the complete improved HTML starting with <!DOCTYPE html>.";
    case "playcanvas":
      return "You are a PlayCanvas expert. Review this pc.Script. Fix any bugs, ensure proper API usage, improve performance. Return ONLY the corrected JavaScript code.";
    case "wonderspace":
      return "You are a senior TypeScript/React engineer. Review this code. Fix type errors, improve patterns, ensure it works. Return ONLY the corrected code.";
    default:
      return "You are a senior frontend engineer. Review this HTML file. Fix issues, enhance visual quality, ensure all interactions work. Return ONLY the complete improved HTML starting with <!DOCTYPE html>.";
  }
}

export async function POST(req: NextRequest) {
  // Validate input
  let body: z.infer<typeof BuildRequestSchema>;
  try {
    const jsonBody = await req.json();
    const result = BuildRequestSchema.safeParse(jsonBody);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.issues },
        { status: 400 }
      );
    }
    body = result.data;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { prompt, type, save, fileName } = body;

  // Check output size limit
  let totalOutputSize = 0;

  const encoder = new TextEncoder();
  const typeLabel = getTypeLabel(type);

  const startTime = Date.now();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: object) => {
        // Check stream timeout
        if (Date.now() - startTime > MAX_STREAM_DURATION_MS) {
          send("error", { message: "Build timeout - took too long" });
          controller.close();
          return;
        }

        // Track output size
        const dataStr = JSON.stringify(data);
        totalOutputSize += dataStr.length;
        if (totalOutputSize > MAX_OUTPUT_SIZE_KB * 1024) {
          send("error", { message: "Output too large" });
          controller.close();
          return;
        }

        controller.enqueue(encoder.encode(sse(event, data)));
      };

      try {
        // --- STAGE 1: ARCHITECT ---
        send("agent", { stage: "architect", status: "running", label: "Architect Agent", message: `Planning your ${typeLabel}…` });

        const plan = await callGemini(
          "You are a senior product architect. In 2 vivid sentences, describe the design and key features of what you will build. Be specific and inspiring.",
          `Plan a ${typeLabel} based on: "${prompt}"`
        );

        send("agent", { stage: "architect", status: "done", label: "Architect Agent", message: plan.slice(0, 300) });

        // --- STAGE 2: BUILDER ---
        send("agent", { stage: "builder", status: "running", label: "Builder Agent", message: `Writing ${typeLabel} code…` });

        const rawCode = await callGemini(
          getSystemPrompt(type),
          `Build this ${typeLabel}: "${prompt}"\n\nDesign vision: ${plan}`
        );
        const code = stripCodeFences(rawCode);

        send("agent", { stage: "builder", status: "done", label: "Builder Agent", message: `Code generated (${(code.length / 1024).toFixed(1)} KB)` });

        // --- STAGE 3: REVIEWER ---
        send("agent", { stage: "reviewer", status: "running", label: "Reviewer Agent", message: "Reviewing and polishing…" });

        const reviewed = await callGemini(getReviewerSystem(type), `Improve this code:\n\n${code}`);
        const finalCode = stripCodeFences(reviewed);

        send("agent", { stage: "reviewer", status: "done", label: "Reviewer Agent", message: "Code reviewed and polished ✓" });

        // --- STAGE 4: RUNNER (optional save) ---
        let savedPath: string | undefined;
        if (save) {
          send("agent", { stage: "runner", status: "running", label: "Runner Agent", message: "Saving to blocks directory…" });
          const ext = type === "playcanvas" ? "js" : type === "wonderspace" ? "tsx" : "html";
          const safeName = (fileName ?? `${type}-${Date.now()}`).replace(/[^a-z0-9-_]/gi, "-");
          const result = manifestVisualBlock(`${safeName}.${ext}`, finalCode, `AI-generated ${typeLabel} — prompt: "${prompt.slice(0, 80)}"`);
          savedPath = result.path;
          send("agent", { stage: "runner", status: "done", label: "Runner Agent", message: `Saved to blocks/ ✓` });
        }

        // --- COMPLETE ---
        send("complete", { type, code: finalCode, plan, savedPath, timestamp: Date.now() });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Build failed";
        logger.error("Build stream error", { error: errorMessage, type, prompt: prompt.slice(0, 100) });
        send("error", { message: "Build failed - please try again" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}
