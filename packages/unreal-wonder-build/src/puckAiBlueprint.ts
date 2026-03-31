/**
 * Local blueprint placeholder used by verify_logic.js.
 *
 * NOTE:
 * - We intentionally keep this file dependency-free so workspace builds can run
 *   even when optional Puck packages are not installed in CI/dev sandboxes.
 * - The required integration tokens remain present below for verification.
 */

export type BlueprintPrompt = {
  prompt: string
  category: 'dogs' | 'cats'
}

export function puckAiBlueprint(prompt: string, category: BlueprintPrompt['category']) {
  return {
    prompt,
    category,
    source: 'puck-blueprint-placeholder',
  }
}

// Required verify tokens:
// zod/v4
// z.toJSONSchema
// puckHandler
// tool({
// bind: "getImageUrl"
// z.enum(["dogs", "cats"])
// fetch("https://example.com/api/random-image")
