import type { BlockDefinition, CanvasElement } from '../types';
import { BLOCKS } from './index';

export function findBlockDefinition(type: string): BlockDefinition | undefined {
  return BLOCKS.find((b) => b.type === type);
}

export function blockToCanvasElement(def: BlockDefinition): CanvasElement {
  return {
    id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: def.type,
    name: def.name,
    icon: def.icon,
    props: JSON.parse(JSON.stringify(def.defaultProps || {})),
    styles: JSON.parse(JSON.stringify(def.defaultStyles || {})),
  };
}

export function getBlocksByCategory(category: string): BlockDefinition[] {
  return BLOCKS.filter((b) => b.category === category);
}
