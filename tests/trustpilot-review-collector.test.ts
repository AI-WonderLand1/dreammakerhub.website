import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('Trustpilot review collector integration', () => {
  it('uses the provided Trustpilot widget and review destination', () => {
    const widget = read('apps/web/components/TrustpilotReviewCollector.tsx');
    expect(widget).toContain('data-businessunit-id="6ab40e6a788645343cb66e6e"');
    expect(widget).toContain('data-template-id="56278e9abfbbba0bdcd568bc"');
    expect(widget).toContain('https://www.trustpilot.com/review/dreammakerhub.website');
    expect(widget).toContain('onReady={initializeWidget}');
    expect(widget).toContain('strategy="lazyOnload"');
  });

  it('provides footer and community placements', () => {
    const footer = read('apps/web/components/Footer.tsx');
    const community = read('apps/web/app/community/page.tsx');
    expect(footer).toContain('<TrustpilotReviewCollector />');
    expect(community).toContain('<TrustpilotReviewCollector />');
  });

  it('allows the bootstrap script and widget frame in CSP', () => {
    const config = read('apps/web/next.config.mjs');
    const script = config.match(/"script-src [^\n]+/);
    const frame = config.match(/"frame-src [^\n]+/);
    expect(script?.[0]).toContain('https://widget.trustpilot.com');
    expect(frame?.[0]).toContain('https://widget.trustpilot.com');
  });
});
