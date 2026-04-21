import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { manifestVisualBlock } from "@core/ai/bridge";
import { getAuthUser, AuthUser } from "@/lib/auth";

export const runtime = "nodejs";

const BuildRequestSchema = z.object({
  prompt: z.string().min(1),
  type: z.enum(["website", "game", "component", "playcanvas", "wonderspace", "3d-assets"]).default("website"),
  save: z.boolean().default(false),
  fileName: z.string().optional(),
});

const MAX_STREAM_DURATION_MS = 120_000;
const MAX_OUTPUT_SIZE_KB = 512;

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



const FREE_MODELS = [
  "openai/gpt-oss-120b:free",
  "qwen/qwen3.6-plus:free",
  "openai/gpt-oss-20b:free",
  "minimax/minimax-m2.5:free",
] as const;

const PAID_MODELS = [
  "gpt-4o",
  "llama-3.1-70b-versatile",
] as const;

async function callOpenCodeAI(system: string, userPrompt: string, isPaid: boolean): Promise<string> {
  const apiKey = process.env.OPENCODE_API_KEY;
  if (!apiKey) throw new Error("OPENCODE_API_KEY is not configured.");

  const model = "opencode/big-pickle";

  const res = await fetch("https://opencode.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 8192,
    }),
  });

  const data = await res.json();
  if (data.error) {
    throw new Error(`GitHub Models (${model}): ${data.error.message}`);
  }

  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error(`${model}: empty response`);
  }

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
    case "3d-assets":  return ASSETS3D_SYSTEM;
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
    case "3d-assets":
      return "You are a senior web developer specializing in 3D integration. Review this website with 3D assets. Fix Three.js integration, improve performance, ensure smooth animations. Return ONLY the complete improved HTML starting with <!DOCTYPE html>.";
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

  let user: AuthUser | null = null;
  try {
    user = await getAuthUser();
  } catch {
    // Anonymous user - will use free tier
  }

  const isPaid = user?.isPaid ?? false;
  const encoder = new TextEncoder();
  const { prompt, type, save, fileName } = body;
  const typeLabel = getTypeLabel(type);
  let totalOutputSize = 0;

  const startTime = Date.now();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: object) => {
        const dataStr = JSON.stringify(data);
        totalOutputSize += dataStr.length;
        controller.enqueue(encoder.encode(sse(event, data)));
      };

      try {
        const tierLabel = isPaid ? "Premium" : "Free";

        // --- STAGE 1: ARCHITECT ---
        send("agent", { stage: "architect", status: "running", label: "Architect Agent", message: `Planning your ${typeLabel}… (${tierLabel} Tier)` });

        const plan = await callOpenCodeAI(
          "You are a senior product architect. In 2 vivid sentences, describe the design and key features of what you will build. Be specific and inspiring.",
          `Plan a ${typeLabel} based on: "${prompt}"`,
          isPaid
        );

        send("agent", { stage: "architect", status: "done", label: "Architect Agent", message: plan.slice(0, 300) });

        // --- STAGE 2: BUILDER ---
        send("agent", { stage: "builder", status: "running", label: "Builder Agent", message: `Writing ${typeLabel} code… (${tierLabel} Tier)` });

        const rawCode = await callOpenCodeAI(
          getSystemPrompt(type),
          `Build this ${typeLabel}: "${prompt}"\n\nDesign vision: ${plan}`,
          isPaid
        );
        const code = stripCodeFences(rawCode);

        send("agent", { stage: "builder", status: "done", label: "Builder Agent", message: `Code generated (${(code.length / 1024).toFixed(1)} KB)` });

        // --- STAGE 3: REVIEWER ---
        send("agent", { stage: "reviewer", status: "running", label: "Reviewer Agent", message: "Reviewing and polishing…" });

        const reviewed = await callOpenCodeAI(getReviewerSystem(type), `Improve this code:\n\n${code}`, isPaid);
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
        send("complete", { type, code: finalCode, plan, savedPath, timestamp: Date.now(), tier: isPaid ? "pro" : "free" });
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
