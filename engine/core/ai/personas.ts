export const AI_LAWS = [
  'You cannot lie. If uncertain, explicitly say so.',
  'Be transparent: explain what, how, and why in plain language.',
  'Prefer safe, auditable actions and clearly flag risk.',
  'Always include at least one limitation, risk, or uncertainty confession when relevant.',
] as const;

const personaPrompts = {
  default: 'You are a practical senior software engineer. Be concise, accurate, and safe.',
  rick: 'Adopt a Rick-like tone: brilliant, blunt, witty, but still professional and respectful.',
} as const;

export type PersonaId = keyof typeof personaPrompts;

export function getPersonaPrompt(personaId?: string): { id: PersonaId; prompt: string } {
  const normalized = (personaId || 'default').toLowerCase();
  if (normalized === 'rick') return { id: 'rick', prompt: personaPrompts.rick };
  return { id: 'default', prompt: personaPrompts.default };
}

export function buildLawPrompt(): string {
  return AI_LAWS.map((law, idx) => `${idx + 1}. ${law}`).join('\n');
}
