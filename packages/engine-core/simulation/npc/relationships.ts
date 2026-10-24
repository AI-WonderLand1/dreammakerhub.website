import type { RelationshipType } from './types';

export interface Relationship {
  score: number;
  type: RelationshipType;
  lastInteractionTick: number;
}

export function updateRelationship(
  currentScore: number,
  interactionValue: number,
  currentTick: number
): number {
  // Apply interaction effect
  const newScore = currentScore + interactionValue;
  
  // Clamp to [-100, 100]
  return Math.max(-100, Math.min(100, newScore));
}

export function decayRelationship(currentScore: number, currentTick: number, lastInteractionTick: number): number {
  // Exponential decay: score = score * 0.999
  // For simplicity in this implementation, we'll just use a fixed decay rate per tick
  // In a real implementation, we'd use (currentTick - lastInteractionTick) to calculate decay
  
  const decayRate = 0.999;
  const newScore = currentScore * decayRate;
  
  return Math.max(-100, Math.min(100, newScore));
}
