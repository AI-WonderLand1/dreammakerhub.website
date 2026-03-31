import { NextResponse } from "next/server";
import { runAI } from "../../wonder-build/ai-router";

/**
 * WonderSpace Terminal API
 * Executes WonderSpace low-code commands via shared AI router
 * Used by Wonder-Build, Playground, and other connected modules
 */

export async function POST(req: Request) {
  try {
    const { command } = await req.json();

    if (!command || command.trim().length === 0) {
      return NextResponse.json({ error: "Missing command" }, { status: 400 });
    }

    const aiResponse = await runAI(
      "terminal-exec",
      `Execute this WonderSpace low-code command:\n\n${command}`
    );

    return NextResponse.json({
      success: true,
      command,
      output: aiResponse,
    });
  } catch (err: any) {
    console.error("❌ WonderSpace terminal error:", err);
    return NextResponse.json(
      { error: "Failed to execute terminal command" },
      { status: 500 }
    );
  }
}
