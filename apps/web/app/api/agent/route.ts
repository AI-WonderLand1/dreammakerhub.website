import { NextResponse } from "next/server";
import { z } from "zod";
import { runModel } from "../../../../../engine/core/ai/runModel";
import { manifestVisualBlock } from "../../../../../engine/core/ai/bridge";
import { logger } from "@/lib/logger";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schema for agent requests
const AgentRequestSchema = z.object({
  agent: z.enum(["builder", "designer", "debugger"]).default("builder"),
  command: z.string().min(1).max(5000),
  projectId: z.string().uuid().optional(),
});

// Allowed commands whitelist - NEVER execute arbitrary code
const ALLOWED_COMMANDS = [
  "build",
  "design",
  "debug",
  "test",
  "lint",
  "format",
] as const;

// Command-specific argument validators
const commandValidators: Record<string, (cmd: string) => boolean> = {
  build: (cmd) => cmd.toLowerCase().includes("build") || cmd.toLowerCase().includes("create"),
  design: (cmd) => cmd.toLowerCase().includes("design") || cmd.toLowerCase().includes("style"),
  debug: (cmd) => cmd.toLowerCase().includes("debug") || cmd.toLowerCase().includes("fix"),
  test: (cmd) => cmd.toLowerCase().includes("test"),
  lint: (cmd) => cmd.toLowerCase().includes("lint"),
  format: (cmd) => cmd.toLowerCase().includes("format"),
};

function validateCommand(command: string): { valid: boolean; category: string } {
  const lowerCmd = command.toLowerCase();
  
  for (const allowed of ALLOWED_COMMANDS) {
    if (commandValidators[allowed](lowerCmd)) {
      return { valid: true, category: allowed };
    }
  }
  
  return { valid: false, category: "unknown" };
}

export async function POST(req: Request) {
  try {
    // Parse and validate input
    let body: z.infer<typeof AgentRequestSchema>;
    try {
      const jsonBody = await req.json();
      const result = AgentRequestSchema.safeParse(jsonBody);
      if (!result.success) {
        return NextResponse.json(
          { 
            status: "error", 
            error: "Invalid request",
            details: result.error.issues 
          },
          { status: 400 }
        );
      }
      body = result.data;
    } catch {
      return NextResponse.json(
        { status: "error", error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { agent, command } = body;

    // Validate command is in whitelist
    const commandCheck = validateCommand(command);
    if (!commandCheck.valid) {
      logger.warn("Blocked unauthorized command", { command: command.slice(0, 100) });
      return NextResponse.json(
        { 
          status: "error", 
          error: "Command not allowed",
          allowedCommands: ALLOWED_COMMANDS 
        },
        { status: 403 }
      );
    }

    // Sanitize command - remove any dangerous patterns
    const dangerousPatterns = [
      /eval\s*\(/gi,
      /Function\s*\(/gi,
      /require\s*\(/gi,
      /import\s*\(/gi,
      /child_process/gi,
      /fs\./gi,
      /process\./gi,
      /exec\s*\(/gi,
      /spawn\s*\(/gi,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(command)) {
        logger.error("Dangerous pattern detected in command", { 
          pattern: pattern.toString(),
          command: command.slice(0, 200) 
        });
        return NextResponse.json(
          { status: "error", error: "Command contains unauthorized code patterns" },
          { status: 403 }
        );
      }
    }

    const systemPrompt = `
      You are the Wonderland ${agent === "designer" ? "Designer" : agent === "debugger" ? "Debugger" : "Architect"}. 
      Build the user's request: "${command}"
      
      COMMAND CATEGORY: ${commandCheck.category}
      
      LAW:
      1. Build ANYTHING requested perfectly.
      2. NEVER use generic components. Use raw Tailwind + Framer Motion for high-end visuals.
      3. If features.ancientSoul is true, integrate Egyptian scripts/phonetics.
      4. NEVER output executable code (eval, Function, require, etc.) - only React components.
      5. NEVER access file system, network, or system APIs.
      
      OUTPUT FORMAT (JSON ONLY):
      {
        "code": "The full React component code - safe, no dynamic execution",
        "glimpse": "Concise summary of the build",
        "confession": "Technical compromises made for visual perfection"
      }
    `;

    const aiResponse = await runModel({
      model: "groq/llama-3.3-70b-versatile",
      messages: [{ role: "user", content: command }],
      system: systemPrompt,
      temperature: 0.7,
    });

    const manifest = JSON.parse(aiResponse.text || '{}');

    // Validate AI output doesn't contain dangerous code
    if (manifest.code) {
      for (const pattern of dangerousPatterns) {
        if (pattern.test(manifest.code)) {
          logger.error("AI generated dangerous code pattern", { pattern: pattern.toString() });
          return NextResponse.json(
            { status: "error", error: "Generated code contains unauthorized patterns" },
            { status: 500 }
          );
        }
      }
    }

    const audit = { success: true, error: null as string | null };

    const finalConfession = audit.success
      ? manifest.confession
      : `RUNNER ERROR: ${audit.error}. ${manifest.confession}`;

    let manifestationResult: { path?: string } | null = null;
    if (manifest.code) {
      manifestationResult = manifestVisualBlock(
        `${agent}-${Date.now()}.tsx`,
        manifest.code,
        finalConfession,
      );
    }

    return NextResponse.json({
      status: audit.success ? "success" : "warning",
      answer: manifest.code,
      glimpse: manifest.glimpse,
      confession: finalConfession,
      trustScore: audit.success ? 98 : 40,
      path: manifestationResult?.path,
      commandCategory: commandCheck.category,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Agent manifestation failed", { error: message });
    return NextResponse.json(
      { status: "error", error: "Processing failed" },  // Generic error, don't leak details
      { status: 500 }
    );
  }
}
