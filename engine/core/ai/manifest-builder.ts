import { vm2Runner } from "../runners/vm2Runner";
import { manifestVisualBlock } from "./bridge";

/**
 * THE COMMAND: Get it done.
 * Takes the AI's "Anything" code, runs it through the IDE logic, 
 * and pushes it to the Visual Builder.
 */
export async function executeManifest(agent: string, code: string, confession: string) {
  // 1. IDE Validation (Is the code clean?)
  const audit = await vm2Runner.execute(code);
  
  // 2. Visual Manifestation (Push to Builder)
  const result = manifestVisualBlock(
    `${agent}-${Date.now()}.tsx`,
    code,
    confession
  );

  return {
    success: audit.success,
    error: audit.error,
    path: result.path,
    trustScore: audit.success ? 95 : 20
  };
}
