export type LayoutNode = {
  id: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  props: Record<string, unknown>;
  children: LayoutNode[];
};

export type LayoutRoot = {
  id: 'root';
  type: 'root';
  children: LayoutNode[];
};

let nodeCounter = 0;

export function createRootNode(): LayoutRoot {
  return {
    id: 'root',
    type: 'root',
    children: [],
  };
}

export function createNode(type: string, props: Record<string, unknown>): LayoutNode {
  nodeCounter += 1;

  return {
    id: `${type}-${nodeCounter}`,
    type,
    x: typeof props.x === 'number' ? props.x : 0,
    y: typeof props.y === 'number' ? props.y : 0,
    w: typeof props.w === 'number' ? props.w : 0,
    h: typeof props.h === 'number' ? props.h : 0,
    props,
    children: [],
  };
}
