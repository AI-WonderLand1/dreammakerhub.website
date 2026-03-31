import {
  PlaygroundModule,
  PlaygroundModuleId,
} from "@/types/playground";
import { playgroundModuleCatalog, PlaygroundModuleSummary } from "./moduleCatalog";
import { runModel } from "@core/ai/runModel";

const moduleMeta: Record<PlaygroundModuleId, PlaygroundModuleSummary> = Object.fromEntries(
  playgroundModuleCatalog.map((meta) => [meta.id, meta])
) as Record<PlaygroundModuleId, PlaygroundModuleSummary>;

// Helper: pick a default model if none is passed in context
const getModel = (ctx: any) => ({
  id: ctx?.modelId || "openai/gpt-4o",
  provider: "openrouter" as const,
});

// Chat module
const chatModule: PlaygroundModule = {
  ...moduleMeta.chat,
  async run(input, ctx) {
    const startedAt = new Date();

    const result = await runModel(
      getModel(ctx),
      {
        prompt: input.prompt,
      }
    );

    const finishedAt = new Date();

    return {
      moduleId: "chat",
      output: result.text,
      timing: {
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
      },
    };
  },
};

// Code generation module
const codeModule: PlaygroundModule = {
  ...moduleMeta.code,
  async run(input, ctx) {
    const startedAt = new Date();

    const enhancedPrompt = `Generate clean, well-documented ${input.language || ""} code for: ${input.prompt}

Include:
- Error handling
- Comments explaining logic
- Best practices
- Example usage`;

    const result = await runModel(
      getModel(ctx),
      {
        prompt: enhancedPrompt,
      }
    );

    const finishedAt = new Date();

    return {
      moduleId: "code",
      output: result.text,
      timing: {
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
      },
    };
  },
};

// Agent module
const agentModule: PlaygroundModule = {
  ...moduleMeta.agent,
  async run(input, ctx) {
    const startedAt = new Date();

    const agentPrompt = `You are an autonomous AI agent. Break down this task into steps and execute them:

Task: ${input.prompt}

Think step-by-step:
1. Analyze what's needed
2. Plan your approach
3. Execute each step
4. Verify results
5. Provide final answer

Show your reasoning process.`;

    const result = await runModel(
      getModel(ctx),
      {
        prompt: agentPrompt,
      }
    );

    const finishedAt = new Date();

    return {
      moduleId: "agent",
      output: result.text,
      timing: {
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
      },
    };
  },
};

// export your modules however you were before
export const playgroundModules = {
  chat: chatModule,
  code: codeModule,
  agent: agentModule,
};
