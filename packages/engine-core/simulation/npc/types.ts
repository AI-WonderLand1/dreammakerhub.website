export interface NpcState {
  id: string;
  name: string;
  hunger: number;
  social: number;
  stress: number;
  traits: { aggression: number; sociability: number; ambition: number };
  tribeId: string | null;
  beliefId: string | null;
  status: 'alive' | 'dead';
  age: number;
}

export type ActionType = 'eat' | 'socialize' | 'rest' | 'work' | 'flee' | 'idle';

export interface DecidedAction {
  npcId: string;
  action: ActionType;
  targetNpcId?: string;
}

export type RelationshipType = 'family' | 'ally' | 'rival' | 'romantic' | 'neutral';

export interface RelationshipEdge {
  npcIdA: string;
  npcIdB: string;
  score: number;
  type: RelationshipType;
  lastInteractionTick: number;
}

export type EventType =
  | 'birth'
  | 'death'
  | 'war'
  | 'alliance'
  | 'conversion'
  | 'innovation'
  | 'dialogue';

export interface SimEvent {
  tick: number;
  type: EventType;
  actorId?: string;
  targetId?: string;
  description: string;
}
