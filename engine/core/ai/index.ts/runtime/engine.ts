import { runAIPipeline } from "./pipeline";

interface EngineRequest {
  operationId: string;
  userPrompt: string;
  language?: string;
  model?: string;
}

interface EngineResponse {
  text: string;
  confessions: import("../confessions/types").LocalizedConfession[];
}

export async function handleAIRequest(req: EngineRequest): Promise<EngineResponse> {
  const language = req.language ?? "en";
  const model = req.model ?? "openrouter:anthropic/claude-3"; // default, adjust as needed

  const result = await runAIPipeline({
    operationId: req.operationId,
    userPrompt: req.userPrompt,
    language,
    model,
  });

  return {
    text: result.finalText,
    confessions: result.confessions,
  };
}
