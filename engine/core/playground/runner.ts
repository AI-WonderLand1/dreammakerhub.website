// core/playground/runner.ts

import {
  PlaygroundModuleInput,
  PlaygroundModuleResult,
  PlaygroundModuleContext,
  PlaygroundModuleId,
} from "@/types/playground";

import { playgroundModulesById } from "./modules";
import { getOrCreateSession, appendMessageToSession } from "./session"; 
// adjust these imports to match your actual session helpers

export async function runPlaygroundModule(
  input: PlaygroundModuleInput,
  baseCtx: Partial<PlaygroundModuleContext> = {}
): Promise<PlaygroundModuleResult> {
  const moduleId: PlaygroundModuleId = input.moduleId;

  const moduleImpl = playgroundModulesById[moduleId];
  if (!moduleImpl) {
    throw new Error(`Unknown playground module: ${moduleId}`);
  }

  // Session handling (only used by chat-like modules)
  const session = await getOrCreateSession(baseCtx.sessionId);

  const ctx: PlaygroundModuleContext = {
    sessionId: session.id,
    userId: baseCtx.userId ?? null,
    mode: moduleId,
  };

  // If this is a chat module, append the user message before running
  if (moduleId === "chat" && input.prompt) {
    await appendMessageToSession(session.id, {
      id: crypto.randomUUID(),
      role: "user",
      content: input.prompt,
      timestamp: new Date(),
    });
  }

  const result = await moduleImpl.run(input, ctx);

  // If chat module returns an assistant message, append it
  if (moduleId === "chat" && result.output) {
    await appendMessageToSession(session.id, {
      id: crypto.randomUUID(),
      role: "assistant",
      content: result.output,
      timestamp: new Date(),
    });

    // Return updated messages for UI
    result.messages = (await getOrCreateSession(session.id)).messages;
  }

  return result;
}
