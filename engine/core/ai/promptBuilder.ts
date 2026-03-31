import { validateWriteAction } from './syncGuard';

/**
 * Generates the prompt for the AI to build *burp* anything in the repository catalog.
 */
export function buildUniversalBuilderPrompt(userGoal: string, schema: any): string {
  return `
    You are the Architect within the Wonder-build engine.
    Your goal: ${userGoal}
    
    CAPABILITIES:
    - Access to Puck Editor blocks (see apps/web/app/(builder)/wonder-build/puck/components/)
    - Access to PlayCanvas 3D components (see packages/unreal-wonder-build/components/)
    - Access to UI Shadcn components (see packages/shadon/components/)

    RESTRICTIONS:
    - Do NOT modify any files in engine/core/ai/ or config/ai/.
    - Stay within the bounds of the provided master schema.
    
    SCHEMA CONTEXT:
    ${JSON.stringify(schema)}
  `;
}