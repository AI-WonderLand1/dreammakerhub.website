import {
  PlaygroundModule,
  PlaygroundModuleId,
} from "@/types/playground";
import { playgroundModuleCatalog } from "./moduleCatalog";
import { runModel } from "../ai/runModel";

function getModuleMeta(id: PlaygroundModuleId) {
  const meta = playgroundModuleCatalog.find((entry) => entry.id === id);
  if (!meta) throw new Error(`Missing playground module metadata: ${id}`);
  return { id, label: meta.label, description: meta.description };
}

function generateResponse(prompt: string, modelId?: string, systemPrompt?: string) {
  return runModel({
    model: modelId || "openrouter/meta-llama/llama-3.3-70b-instruct:free",
    messages: [{ role: "user", content: prompt }],
    system: systemPrompt,
  });
}

// Chat module
const chatModule: PlaygroundModule = {
  ...getModuleMeta("chat"),
  kind: "chat",
  async run(input, ctx) {
    const startedAt = new Date();

    const result = await generateResponse(input.prompt, input.modelId, input.systemPrompt);

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
  ...getModuleMeta("code"),
  kind: "code",
  async run(input, ctx) {
    const startedAt = new Date();

    const enhancedPrompt = `Generate clean, well-documented ${input.language || ""} code for: ${input.prompt}

Include:
- Error handling
- Comments explaining logic
- Best practices
- Example usage`;

    const result = await generateResponse(enhancedPrompt, input.modelId, input.systemPrompt);

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
  ...getModuleMeta("agent"),
  kind: "agent",
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

Summarize the actions taken and any limitations; never claim to execute external actions without tools.`;

    const result = await generateResponse(agentPrompt, input.modelId, input.systemPrompt);

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
export const playgroundModules: Partial<Record<PlaygroundModuleId, PlaygroundModule>> = {
  chat: chatModule,
  code: codeModule,
  agent: agentModule,
};

export const playgroundModulesById = playgroundModules;
