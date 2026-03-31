export interface BlockDefinition {
  id: string;
  name: string;
  category: string;
  component: any;
}

const blocks: Map<string, BlockDefinition> = new Map();

export function registerBlock(block: BlockDefinition) {
  blocks.set(block.id, block);
}

export function getBlock(id: string) {
  return blocks.get(id);
}

export function getAllBlocks() {
  return Array.from(blocks.values());
}
