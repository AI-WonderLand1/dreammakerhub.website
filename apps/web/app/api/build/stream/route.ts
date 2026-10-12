import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requirePaidAIUser } from "@/app/api/ai/auth";
import { reserveAiRequest } from "@/lib/billing/cost-guard.server";
import { runModel } from "../../../core/ai/runModel";
import { logger } from '@/lib/logger';

export const runtime = "nodejs";

const BuildRequestSchema = z.object({
  prompt: z.string().trim().min(1).max(4000),
  type: z.enum(["website", "game", "component", "playcanvas", "wonderspace", "3d-assets", "spatial"]).default("website"),
  save: z.boolean().default(false),
  fileName: z.string().optional(),
});

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

const ASSETS3D_SYSTEM = `You are an expert web developer specializing in 3D integration. Build websites that embed 3D assets using Three.js.
Rules:
- Output a FULL standalone HTML file with embedded CSS and JavaScript
- Use Three.js via CDN: <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
- Include interactive 3D elements: rotating models, animated objects, camera controls
- Use realistic 3D assets from the WonderSpace library (cubes, spheres, basic shapes)
- Add smooth animations and user interactions
- Make the 3D integration seamless and performant
- Output ONLY the complete HTML — no markdown fences, no explanation

Start your output with <!DOCTYPE html>`;

const SPATIAL_SYSTEM = `You are an expert spatial world designer for the AI WONDERLAND Spatial Engine.
Build a complete SpatialWorld JSON definition that can be rendered with Gaussian Splatting and Three.js.
Rules:
- Output a valid SpatialWorld JSON object (no markdown fences, no explanation)
- Include a "version" field (number, use 1)
- Include an "assets" array with at least one asset (kind: "splat", "model", or "texture")
- Include a "nodes" array describing the scene graph (position, rotation, scale, children)
- Include "environment" settings (background color, ground plane)
- Include "settings" with "defaultRenderer" set to "splat" or "three"
- Make the world visually interesting: use lights, proper camera positioning, ground grid
- Each asset needs: id, kind, url (use placeholder URLs like "/assets/splat-1.ply")
- Each node needs: id, type ("mesh", "light", "group"), position as [x,y,z]
- Output ONLY the raw JSON object — no markdown fences, no explanation

Format:
{"version":1,"name":"World Name","assets":[...],"nodes":[...],"environment":{...},"settings":{...}}`;

const BUILD_OUTPUT_BUDGET = 2048;
async function callAI(userId: string, system: string, userPrompt: string): Promise<string> {
  await reserveAiRequest(userId, system.length + userPrompt.length, BUILD_OUTPUT_BUDGET);
  const result = await runModel({
    model: "meta-llama/llama-3.3-70b-instruct:free",
    messages: [{ role: "user", content: userPrompt }], system,
    temperature: 0.35, maxTokens: BUILD_OUTPUT_BUDGET, singleProviderAttempt: true,
  });
  if (result.error || !result.text.trim()) throw new Error("AI provider could not complete this build stage.");
  return result.text;
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
    case "3d-assets":  return ASSETS3D_SYSTEM;
    case "spatial":    return SPATIAL_SYSTEM;
    default:           return WEBSITE_SYSTEM;
  }
}

function getTypeLabel(type: string): string {
  switch (type) {
    case "game":       return "HTML5 game";
    case "component":  return "UI component";
    case "playcanvas": return "PlayCanvas script";
    case "wonderspace": return "WonderSpace module";
    case "3d-assets":  return "website with 3D assets";
    case "spatial":    return "spatial world";
    default:           return "website";
  }
}

function getReviewerSystem(type: string): string {
  switch (type) {
    case "game":
      return "You are a senior game developer. Review this HTML5 game. Fix bugs, improve game feel, ensure all input works. Return ONLY the complete improved HTML starting with <!DOCTYPE html>.";
    case "component":
      return "You are a senior React UI engineer. Review this React component. Fix prop types, improve accessibility, ensure interactivity works. Return ONLY the complete improved HTML starting with <!DOCTYPE html>.";
    case "playcanvas":
      return "You are a PlayCanvas expert. Review this pc.Script. Fix any bugs, ensure proper API usage, improve performance. Return ONLY the corrected JavaScript code.";
    case "wonderspace":
      return "You are a senior TypeScript/React engineer. Review this code. Fix type errors, improve patterns, ensure it works. Return ONLY the corrected code.";
    case "3d-assets":
      return "You are a senior web developer specializing in 3D integration. Review this website with 3D assets. Fix Three.js integration, improve performance, ensure smooth animations. Return ONLY the complete improved HTML starting with <!DOCTYPE html>.";
    case "spatial":
      return "You are a spatial world designer. Review this SpatialWorld JSON. Fix any structural issues, ensure valid node hierarchy, verify asset references are consistent, improve the scene composition. Return ONLY the corrected SpatialWorld JSON object.";
    default:
      return "You are a senior frontend engineer. Review this HTML file. Fix issues, enhance visual quality, ensure all interactions work. Return ONLY the complete improved HTML starting with <!DOCTYPE html>.";
  }
}

function checkAbort(signal: AbortSignal): void {
  if (signal.aborted) {
    throw new Error('Build aborted by user');
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

  const auth = await requirePaidAIUser(req);
  if (auth instanceof NextResponse) return auth;
  if (process.env.BILLABLE_OPERATIONS_ENABLED !== 'true') return NextResponse.json({ error: 'AI billing safeguards are not active.', code: 'COST_GUARD' }, { status: 503 });
  if (body.save) return NextResponse.json({ error: 'Save generated code through your authenticated project editor.' }, { status: 400 });
  if (body.type === 'spatial') return NextResponse.json({ error: 'Spatial generation requires verified asset URLs and is not available yet.' }, { status: 503 });
  if (![process.env.OPENROUTER_API_KEY, process.env.GROQ_API_KEY, process.env.GEMINI_API_KEY, process.env.GOOGLE_AI_API_KEY, process.env.CEREBRAS_API_KEY].some(key => key?.trim())) return NextResponse.json({ error: 'AI provider is not configured. No usage was reserved.' }, { status: 503 });
  const encoder = new TextEncoder();
  const { prompt, type } = body;
  const typeLabel = getTypeLabel(type);
  let totalOutputSize = 0;
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: object) => {
        const dataStr = JSON.stringify(data);
        totalOutputSize += dataStr.length;
        controller.enqueue(encoder.encode(sse(event, data)));
      };

      try {
        const tierLabel = "Metered";

        // --- STAGE 1: ARCHITECT ---
        send("agent", { stage: "architect", status: "running", label: "Architect Agent", message: `Planning your ${typeLabel}… (${tierLabel} Tier)` });

        if (req.signal.aborted) return;
        const plan = await callAI(
          auth.userId,
          "You are a senior product architect. In 2 vivid sentences, describe the design and key features of what you will build. Be specific and inspiring.",
          `Plan a ${typeLabel} based on: "${prompt}"`
        );

        send("agent", { stage: "architect", status: "done", label: "Architect Agent", message: plan.slice(0, 300) });

        // --- STAGE 2: BUILDER ---
        send("agent", { stage: "builder", status: "running", label: "Builder Agent", message: `Writing ${typeLabel} code… (${tierLabel} Tier)` });

        if (req.signal.aborted) return;
        const rawCode = await callAI(
          auth.userId,
          getSystemPrompt(type),
          `Build this ${typeLabel}: "${prompt}"\n\nDesign vision: ${plan}`
        );
        const code = stripCodeFences(rawCode);

        send("agent", { stage: "builder", status: "done", label: "Builder Agent", message: `Code generated (${(code.length / 1024).toFixed(1)} KB)` });

        // --- STAGE 3: REVIEWER ---
        send("agent", { stage: "reviewer", status: "running", label: "Reviewer Agent", message: "Reviewing and polishing…" });

        if (req.signal.aborted) return;
        const reviewed = await callAI(auth.userId, getReviewerSystem(type), `Improve this code:\n\n${code}`);
        const finalCode = stripCodeFences(reviewed);

        send("agent", { stage: "reviewer", status: "done", label: "Reviewer Agent", message: "Code reviewed and polished ✓" });

        send("complete", { type, code: finalCode, plan, timestamp: Date.now(), tier: "metered" });
      } catch (err: any) {
        send("error", { message: err.message ?? "Build failed" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}
