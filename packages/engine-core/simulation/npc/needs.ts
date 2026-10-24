export function decayNeeds(npc: any): any {
  const updated = { ...npc };

  // Hunger increases (more hungry)
  updated.hunger = Math.min(100, (updated.hunger || 0) + 2);

  // Social increases (more lonely)
  updated.social = Math.min(100, (updated.social || 0) + 1);

  // Stress increases (more stressed)
  updated.stress = Math.min(100, (updated.stress || 0) + 1);

  return updated;
}
