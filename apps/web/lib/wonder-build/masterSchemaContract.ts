export type WonderBuildBlockType = 'hero' | 'features' | 'footer';

export type WonderBuildSection = {
  id: string;
  type: WonderBuildBlockType;
  order: number;
  children: Array<{ id: string; type: string; text?: string }>;
};

export type WonderBuildBlock = {
  id: string;
  type: WonderBuildBlockType;
  content: Record<string, unknown>;
};

export type WonderBuildStatePayload = {
  blocks: WonderBuildBlock[];
  theme: Record<string, string>;
  layout: {
    sections: WonderBuildSection[];
  };
};

export type TrustStatus = 'idle' | 'loading' | 'empty' | 'error' | 'ready';

export const DETERMINISTIC_BLOCK_TYPES: WonderBuildBlockType[] = ['hero', 'features', 'footer'];

export function isWonderBuildStatePayload(value: unknown): value is WonderBuildStatePayload {
  if (!value || typeof value !== 'object') return false;
  const state = value as WonderBuildStatePayload;

  if (!Array.isArray(state.blocks) || state.blocks.length < DETERMINISTIC_BLOCK_TYPES.length) {
    return false;
  }

  const hasValidBlocks = state.blocks.every((block) =>
    Boolean(block?.id) && DETERMINISTIC_BLOCK_TYPES.includes(block?.type as WonderBuildBlockType)
  );

  if (!hasValidBlocks) return false;
  if (!state.theme || typeof state.theme !== 'object') return false;
  if (!state.layout || !Array.isArray(state.layout.sections)) return false;

  return state.layout.sections.every(
    (section) =>
      Boolean(section?.id) &&
      DETERMINISTIC_BLOCK_TYPES.includes(section?.type as WonderBuildBlockType) &&
      typeof section?.order === 'number' &&
      Array.isArray(section?.children)
  );
}
