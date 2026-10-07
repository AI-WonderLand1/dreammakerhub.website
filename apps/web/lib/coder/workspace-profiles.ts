export type WorkspaceProfileId = 'micro' | 'standard' | 'power' | 'max';

export type WorkspaceProfile = {
  id: WorkspaceProfileId;
  name: string;
  cpu: number;
  memoryGiB: number;
  computeMultiplier: 1 | 2 | 4 | 8;
  /** Allocation quota cost used by AI WONDERLAND billing. */
  quotaCredits: 10 | 20 | 40 | 80;
  description: string;
};

export const WORKSPACE_PROFILES: readonly WorkspaceProfile[] = [
  {
    id: 'micro',
    name: 'Micro',
    cpu: 1,
    memoryGiB: 2,
    computeMultiplier: 1,
    quotaCredits: 10,
    description: 'Light coding, small sites, scripts and quick edits.',
  },
  {
    id: 'standard',
    name: 'Standard',
    cpu: 2,
    memoryGiB: 4,
    computeMultiplier: 2,
    quotaCredits: 20,
    description: 'General web development, Node.js and normal builds.',
  },
  {
    id: 'power',
    name: 'Power',
    cpu: 4,
    memoryGiB: 8,
    computeMultiplier: 4,
    quotaCredits: 40,
    description: 'Large builds, heavier compiles and AI tooling.',
  },
  {
    id: 'max',
    name: 'Max',
    cpu: 8,
    memoryGiB: 16,
    computeMultiplier: 8,
    quotaCredits: 80,
    description: 'Short high-performance sessions and demanding builds.',
  },
] as const;

export function workspaceProfile(id: unknown): WorkspaceProfile | null {
  if (typeof id !== 'string') return null;
  return WORKSPACE_PROFILES.find((profile) => profile.id === id) ?? null;
}

export function computeCreditsForMinutes(profile: WorkspaceProfile, minutes: number): number {
  return Math.ceil(Math.max(0, minutes) * profile.computeMultiplier);
}
