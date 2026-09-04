import { beforeEach, describe, expect, it } from 'vitest';
import { useBuilderStore } from '../apps/web/lib/builder/store';
import type { CanvasElement, SitePage } from '../apps/web/lib/builder/types';

function block(id: string, type = 'text', name = id, children?: CanvasElement[]): CanvasElement {
  return {
    id,
    type,
    name,
    props: {},
    styles: {},
    children,
  };
}

function resetStore(elements: CanvasElement[]) {
  const home: SitePage = {
    id: 'home',
    name: 'Home',
    slug: '/',
    elements,
  };

  useBuilderStore.setState({
    pages: [home],
    activePageId: 'home',
    elements,
    selectedId: null,
    history: { past: [], future: [] },
  });
}

function find(elements: CanvasElement[], id: string): CanvasElement | null {
  for (const element of elements) {
    if (element.id === id) return element;
    const nested = find(element.children || [], id);
    if (nested) return nested;
  }
  return null;
}

beforeEach(() => resetStore([]));

describe('WonderBuild nested drag/drop state', () => {
  it('adds a block into a deeply nested container', () => {
    const column = block('column', 'column');
    const container = block('container', 'container', 'Container', [column]);
    const section = block('section', 'section', 'Section', [container]);
    resetStore([section]);

    useBuilderStore.getState().addElement(block('button', 'button', 'Button'), 'column');

    const state = useBuilderStore.getState();
    expect(find(state.elements, 'column')?.children?.map((item) => item.id)).toEqual(['button']);
    expect(find(state.pages[0].elements, 'column')?.children?.map((item) => item.id)).toEqual(['button']);
  });

  it('moves an existing root block into a deeply nested container without losing it', () => {
    const target = block('target', 'container');
    const inner = block('inner', 'container', 'Inner', [target]);
    const section = block('section', 'section', 'Section', [inner]);
    const button = block('button', 'button', 'Button');
    resetStore([section, button]);

    useBuilderStore.getState().moveElement('button', 'target', 0);

    const state = useBuilderStore.getState();
    expect(state.elements.map((item) => item.id)).toEqual(['section']);
    expect(find(state.elements, 'target')?.children?.map((item) => item.id)).toEqual(['button']);
  });

  it('falls back to the page root if a stale drop target disappears', () => {
    const button = block('button', 'button', 'Button');
    resetStore([button]);

    useBuilderStore.getState().moveElement('button', 'missing-container', 0);

    expect(useBuilderStore.getState().elements.map((item) => item.id)).toEqual(['button']);
  });

  it('duplicates a nested element next to the original and selects the copy', () => {
    const button = block('button', 'button', 'Button');
    const container = block('container', 'container', 'Container', [button]);
    resetStore([container]);

    useBuilderStore.getState().duplicateElement('button');

    const state = useBuilderStore.getState();
    const children = find(state.elements, 'container')?.children || [];
    expect(children).toHaveLength(2);
    expect(children[0].id).toBe('button');
    expect(children[1].name).toBe('Button (copy)');
    expect(state.selectedId).toBe(children[1].id);
  });

  it('syncs nested mutations into the active page snapshot', () => {
    const container = block('container', 'container');
    resetStore([container]);

    useBuilderStore.getState().addElement(block('heading', 'heading', 'Heading'), 'container');
    useBuilderStore.getState().updateElementStyles('heading', { color: '#8b5cf6' });

    const state = useBuilderStore.getState();
    expect(find(state.pages[0].elements, 'heading')?.styles?.color).toBe('#8b5cf6');
  });
});
