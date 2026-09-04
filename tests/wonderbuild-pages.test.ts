import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  addSitePage,
  normalizeSitePages,
  renameSitePage,
  switchSitePage,
} from '../apps/web/lib/builder/pages';
import { useBuilderStore } from '../apps/web/lib/builder/store';
import { HistoryService } from '../apps/web/lib/builder/pipeline/HistoryService';
import { resetEventBus } from '../apps/web/lib/builder/pipeline/EventBus';
import type { CanvasElement, SitePage } from '../apps/web/lib/builder/types';

function element(id: string, name = id): CanvasElement {
  return {
    id,
    type: 'text',
    name,
    props: { text: name },
    styles: {},
  };
}

function homePage(elements: CanvasElement[] = []): SitePage {
  return {
    id: 'home',
    name: 'Home',
    slug: '/',
    elements,
  };
}

function resetStore(elements: CanvasElement[] = []) {
  useBuilderStore.setState({
    pages: [homePage(elements)],
    activePageId: 'home',
    elements,
    selectedId: null,
    history: { past: [], future: [] },
  });
}

let historyService: HistoryService | null = null;

beforeEach(() => {
  resetEventBus();
  resetStore();
});

afterEach(() => {
  historyService?.stop();
  historyService = null;
  resetEventBus();
  resetStore();
});

describe('WonderBuild page model', () => {
  it('migrates a legacy single-page element tree into Home', () => {
    const legacyElements = [element('legacy-hero', 'Legacy Hero')];

    const site = normalizeSitePages(undefined, undefined, legacyElements);

    expect(site.activePageId).toBe('home');
    expect(site.pages).toHaveLength(1);
    expect(site.pages[0]).toMatchObject({ id: 'home', name: 'Home', slug: '/' });
    expect(site.pages[0].elements).toEqual(legacyElements);
    expect(site.elements).toEqual(legacyElements);
  });

  it('creates a blank page while preserving the active page content', () => {
    const homeElements = [element('home-hero', 'Home Hero')];

    const next = addSitePage([homePage(homeElements)], 'home', homeElements, 'About');

    expect(next.pages).toHaveLength(2);
    expect(next.pages[0].elements).toEqual(homeElements);
    expect(next.page.name).toBe('About');
    expect(next.page.slug).toBe('about');
    expect(next.page.elements).toEqual([]);
    expect(next.activePageId).toBe(next.page.id);
    expect(next.elements).toEqual([]);
  });

  it('syncs outgoing content before switching and restores the target content', () => {
    const originalHome = [element('home-old')];
    const editedHome = [element('home-new')];
    const aboutElements = [element('about-copy')];
    const pages: SitePage[] = [
      homePage(originalHome),
      { id: 'about', name: 'About', slug: 'about', elements: aboutElements },
    ];

    const next = switchSitePage(pages, 'home', editedHome, 'about');

    expect(next).not.toBeNull();
    expect(next?.activePageId).toBe('about');
    expect(next?.elements).toEqual(aboutElements);
    expect(next?.pages.find((page) => page.id === 'home')?.elements).toEqual(editedHome);
  });

  it('renames a page without silently changing its slug', () => {
    const pages: SitePage[] = [
      homePage(),
      { id: 'about', name: 'About', slug: 'about-us', elements: [] },
    ];

    const renamed = renameSitePage(pages, 'about', 'Our Company');

    expect(renamed.find((page) => page.id === 'about')).toMatchObject({
      name: 'Our Company',
      slug: 'about-us',
    });
  });
});

describe('WonderBuild page store regression flow', () => {
  it('keeps Home and a new page isolated across switch, rename, and reload normalization', () => {
    const homeHero = element('home-hero', 'Home Hero');
    resetStore([homeHero]);

    useBuilderStore.getState().selectElement(homeHero.id);
    const aboutId = useBuilderStore.getState().createPage('About');

    expect(useBuilderStore.getState().activePageId).toBe(aboutId);
    expect(useBuilderStore.getState().selectedId).toBeNull();
    expect(useBuilderStore.getState().elements).toEqual([]);

    const aboutHero = element('about-hero', 'About Hero');
    useBuilderStore.getState().addElement(aboutHero);

    expect(useBuilderStore.getState().switchPage('home')).toBe(true);
    expect(useBuilderStore.getState().elements).toEqual([homeHero]);

    expect(useBuilderStore.getState().switchPage(aboutId)).toBe(true);
    expect(useBuilderStore.getState().elements).toEqual([aboutHero]);

    expect(useBuilderStore.getState().renamePage(aboutId, 'Company')).toBe(true);
    const renamed = useBuilderStore.getState().pages.find((page) => page.id === aboutId);
    expect(renamed?.name).toBe('Company');
    expect(renamed?.slug).toBe('about');

    expect(useBuilderStore.getState().switchPage('home')).toBe(true);
    expect(useBuilderStore.getState().switchPage(aboutId)).toBe(true);

    const snapshot = useBuilderStore.getState();
    const reloaded = normalizeSitePages(snapshot.pages, snapshot.activePageId, snapshot.elements);

    expect(reloaded.pages).toHaveLength(2);
    expect(reloaded.activePageId).toBe(aboutId);
    expect(reloaded.elements).toEqual([aboutHero]);
    expect(reloaded.pages.find((page) => page.id === 'home')?.elements).toEqual([homeHero]);
    expect(reloaded.pages.find((page) => page.id === aboutId)).toMatchObject({
      name: 'Company',
      slug: 'about',
      elements: [aboutHero],
    });
  });

  it('clears cross-page history so Undo cannot restore another page content', () => {
    const homeRoot = element('home-root', 'Home Root');
    resetStore([homeRoot]);

    historyService = new HistoryService();
    historyService.start();

    const homeEdit = element('home-edit', 'Home Edit');
    useBuilderStore.getState().addElement(homeEdit);

    const aboutId = useBuilderStore.getState().createPage('About');
    const aboutOne = element('about-one', 'About One');
    useBuilderStore.getState().addElement(aboutOne);

    useBuilderStore.getState().switchPage('home');
    expect(useBuilderStore.getState().elements).toEqual([homeRoot, homeEdit]);

    useBuilderStore.getState().switchPage(aboutId);
    expect(useBuilderStore.getState().elements).toEqual([aboutOne]);

    const aboutTwo = element('about-two', 'About Two');
    useBuilderStore.getState().addElement(aboutTwo);
    expect(useBuilderStore.getState().elements).toEqual([aboutOne, aboutTwo]);

    useBuilderStore.getState().undo();

    expect(useBuilderStore.getState().activePageId).toBe(aboutId);
    expect(useBuilderStore.getState().elements).toEqual([aboutOne]);
    expect(useBuilderStore.getState().elements.some((item) => item.id.startsWith('home-'))).toBe(false);
    expect(useBuilderStore.getState().pages.find((page) => page.id === 'home')?.elements).toEqual([
      homeRoot,
      homeEdit,
    ]);
  });
});
