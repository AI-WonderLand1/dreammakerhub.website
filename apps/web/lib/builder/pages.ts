import type { CanvasElement, SitePage } from './types';

export const DEFAULT_PAGE_ID = 'home';
export const DEFAULT_PAGE_NAME = 'Home';
export const DEFAULT_PAGE_SLUG = 'home';

function pageId(): string {
  return `page-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function slugifyPageName(value: string): string {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'page';
}

function uniqueSlug(base: string, pages: SitePage[], ignorePageId?: string): string {
  const used = new Set(
    pages
      .filter((page) => page.id !== ignorePageId)
      .map((page) => page.slug)
  );

  if (!used.has(base)) return base;

  let index = 2;
  while (used.has(`${base}-${index}`)) index += 1;
  return `${base}-${index}`;
}

export function createSitePage(
  pages: SitePage[],
  name = 'Untitled Page',
  elements: CanvasElement[] = [],
): SitePage {
  const cleanName = name.trim() || 'Untitled Page';
  const slug = uniqueSlug(slugifyPageName(cleanName), pages);

  return {
    id: pageId(),
    name: cleanName,
    slug,
    elements,
  };
}

export function syncActivePageElements(
  pages: SitePage[],
  activePageId: string,
  elements: CanvasElement[],
): SitePage[] {
  return pages.map((page) =>
    page.id === activePageId ? { ...page, elements } : page
  );
}

export function normalizeSitePages(
  rawPages: unknown,
  rawActivePageId: unknown,
  legacyElements?: CanvasElement[],
): { pages: SitePage[]; activePageId: string; elements: CanvasElement[] } {
  const parsedPages = Array.isArray(rawPages)
    ? rawPages
        .filter((page): page is SitePage => Boolean(page && typeof page === 'object'))
        .map((page, index) => {
          const candidate = page as Partial<SitePage>;
          const name = typeof candidate.name === 'string' && candidate.name.trim()
            ? candidate.name.trim()
            : index === 0 ? DEFAULT_PAGE_NAME : `Page ${index + 1}`;
          const id = typeof candidate.id === 'string' && candidate.id
            ? candidate.id
            : index === 0 ? DEFAULT_PAGE_ID : `page-${index + 1}`;
          const slug = typeof candidate.slug === 'string' && candidate.slug
            ? slugifyPageName(candidate.slug)
            : slugifyPageName(name);

          return {
            id,
            name,
            slug,
            elements: Array.isArray(candidate.elements) ? candidate.elements : [],
          };
        })
    : [];

  if (parsedPages.length === 0) {
    const elements = Array.isArray(legacyElements) ? legacyElements : [];
    return {
      pages: [{
        id: DEFAULT_PAGE_ID,
        name: DEFAULT_PAGE_NAME,
        slug: DEFAULT_PAGE_SLUG,
        elements,
      }],
      activePageId: DEFAULT_PAGE_ID,
      elements,
    };
  }

  const requestedActiveId = typeof rawActivePageId === 'string' ? rawActivePageId : '';
  const activePageId = parsedPages.some((page) => page.id === requestedActiveId)
    ? requestedActiveId
    : parsedPages[0].id;

  const pages = Array.isArray(legacyElements)
    ? syncActivePageElements(parsedPages, activePageId, legacyElements)
    : parsedPages;
  const activePage = pages.find((page) => page.id === activePageId) || pages[0];

  return {
    pages,
    activePageId: activePage.id,
    elements: activePage.elements,
  };
}

export function addSitePage(
  pages: SitePage[],
  activePageId: string,
  activeElements: CanvasElement[],
  name = 'Untitled Page',
): { pages: SitePage[]; activePageId: string; elements: CanvasElement[]; page: SitePage } {
  const syncedPages = syncActivePageElements(pages, activePageId, activeElements);
  const page = createSitePage(syncedPages, name);

  return {
    pages: [...syncedPages, page],
    activePageId: page.id,
    elements: page.elements,
    page,
  };
}

export function switchSitePage(
  pages: SitePage[],
  activePageId: string,
  activeElements: CanvasElement[],
  nextPageId: string,
): { pages: SitePage[]; activePageId: string; elements: CanvasElement[] } | null {
  const syncedPages = syncActivePageElements(pages, activePageId, activeElements);
  const nextPage = syncedPages.find((page) => page.id === nextPageId);
  if (!nextPage) return null;

  return {
    pages: syncedPages,
    activePageId: nextPage.id,
    elements: nextPage.elements,
  };
}

export function renameSitePage(
  pages: SitePage[],
  pageIdToRename: string,
  nextName: string,
): SitePage[] {
  const cleanName = nextName.trim() || 'Untitled Page';
  const page = pages.find((candidate) => candidate.id === pageIdToRename);
  if (!page) return pages;

  const nextSlug = uniqueSlug(slugifyPageName(cleanName), pages, pageIdToRename);
  return pages.map((candidate) =>
    candidate.id === pageIdToRename
      ? { ...candidate, name: cleanName, slug: nextSlug }
      : candidate
  );
}
