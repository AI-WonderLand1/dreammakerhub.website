/**
 * Exact, versioned language shown before an AI-training opt-in.
 * Keep this text in sync with docs/legal/alice-ai-training-consent-v1.md.
 * Changes to purpose, content categories, or withdrawal rules require a NEW
 * consent version and re-consent rather than silently extending old consent.
 */
export const AI_TRAINING_CONSENT_VERSION = '2026-10-13-v1' as const;

export const AI_TRAINING_CONSENT_TEXT =
  'I choose to allow AI WONDERLAND to use my submitted prompts, project content, ' +
  'generated code, and feedback to evaluate and improve Alice, create reusable ' +
  'examples, and train future AI models. This is optional, and I may withdraw ' +
  'permission later in Privacy & Data settings.' as const;
