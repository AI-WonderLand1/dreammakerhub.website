import "server-only";
import { runModel } from "@core/ai/runModel";

export interface AIWorkerTask {
  id: string;
  type: "chat" | "code" | "agent" | "build";
  prompt: string;
  language?: string;
  modelId?: string;
  metadata?: Record<string, unknown>;
}

export interface AIWorkerResult {
  status: "COMPLETED" | "FAILED" | "PENDING";
  taskId: string;
  output?: string;
  artifacts?: Array<{ path: string; content: string }>;
  logs: string[];
  error?: string;
  timing?: {
    startedAt: string;
    finishedAt: string;
    durationMs: number;
  };
}

const TASK_SYSTEMS: Record<AIWorkerTask["type"], string> = {
  chat: "You are a helpful AI assistant. Provide clear, concise, and accurate responses.",
  code: `Generate clean, well-documented code.

Include:
- Error handling
- Comments explaining logic
- Best practices
- Example usage`,
  agent: `You are an autonomous AI agent. Break down this task into steps and execute them:

Think step-by-step:
1. Analyze what's needed
2. Plan your approach
3. Execute each step
4. Verify results
5. Provide final answer

Show your reasoning process.`,
  build: `You are an elite frontend engineer. Build complete, production-ready code.`,
};

export const aiWorker = async (task: AIWorkerTask): Promise<AIWorkerResult> => {
  const startedAt = new Date();
  const logs: string[] = [];

  try {
    logs.push(`Agent-Runner: Processing ${task.type} task ${task.id}`);

    const system = TASK_SYSTEMS[task.type] || TASK_SYSTEMS.chat;
    let prompt = task.prompt;

    if (task.type === "code" && task.language) {
      prompt = `Generate clean, well-documented ${task.language} code for: ${prompt}`;
    }

    logs.push(`Calling AI model...`);

    const modelId = task.modelId || "openrouter/auto";
    const result = await runModel({
      model: modelId,
      messages: [{ role: "user", content: prompt }],
      system,
    });

    logs.push(`AI response received (${result.text.length} chars)`);

    const finishedAt = new Date();

    return {
      status: "COMPLETED",
      taskId: task.id,
      output: result.text,
      logs,
      timing: {
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
      },
    };
  } catch (error) {
    const finishedAt = new Date();
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    logs.push(`Error: ${errorMessage}`);

    return {
      status: "FAILED",
      taskId: task.id,
      logs,
      error: errorMessage,
      timing: {
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
      },
    };
  }
};
