import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const studio = readFileSync(new URL('../apps/web/components/studio/StudioApp.tsx', import.meta.url), 'utf8');
const layout = readFileSync(new URL('../apps/web/components/studio/StudioEditor.css', import.meta.url), 'utf8');
const navigation = readFileSync(new URL('../apps/web/components/studio/StudioNavigation.css', import.meta.url), 'utf8');
const browser = readFileSync(new URL('../apps/web/components/studio/StudioContentBrowser.tsx', import.meta.url), 'utf8');

describe('WonderPlay unified editor layout', () => {
  it('keeps every 3D tool on the existing studio route rather than linking to extra setup pages', () => {
    for (const component of ['Studio3DFactory', 'Studio360View', 'StudioGameFoundation', 'StudioMovieMaker']) {
      expect(studio).toContain(`<${component} />`);
    }
    expect(studio).toContain('onClick={() => setMode(id)}');
    expect(studio).toContain('<StudioContentBrowser />');
    expect(studio).not.toContain('GPU ENGINE READY');
  });

  it('docks the outliner, viewport, details and content browser in one workspace', () => {
    expect(layout).toContain('OUTLINER / PROJECT FILES');
    expect(layout).toContain('PERSPECTIVE  •  LIT');
    expect(layout).toContain('DETAILS / AI TOOLS');
    expect(layout).toContain('.wonderplay-browser');
    expect(browser).toContain('aria-label="Project content browser"');
  });

  it('only displays real project files and does not request the synthetic default project', () => {
    expect(browser).toContain('projectId === "default"');
    expect(browser).toContain('/api/projects/${encodeURIComponent(projectId)}/files');
    expect(browser).not.toContain('mockAssets');
  });

  it('provides site navigation in a top-bar menu while hiding the dashboard sidebar on this page', () => {
    expect(studio).toContain('className="wonderplay-site-menu"');
    expect(studio).toContain('aria-label="DreamMakerHub navigation"');
    for (const href of ['/dashboard', '/dashboard/projects', '/wonder-build/builder', '/wonderspace', '/dashboard/settings']) {
      expect(studio).toContain(`href: "${href}"`);
    }
    expect(studio).toContain('className="wonderplay-tabs"');
    expect(navigation).toContain('body:has(.wonderplay-app) aside.fixed');
    expect(navigation).toContain('body:has(.wonderplay-app) header.fixed');
    expect(navigation).toContain('position: absolute;');
  });
});
