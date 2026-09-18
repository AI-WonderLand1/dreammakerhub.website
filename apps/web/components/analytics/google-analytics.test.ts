import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const analyticsSource = readFileSync(new URL('./AmplitudeAnalytics.tsx', import.meta.url), 'utf8');
const nextConfigSource = readFileSync(new URL('../../next.config.mjs', import.meta.url), 'utf8');

describe('Google Analytics integration', () => {
  it('loads the requested GA4 measurement ID', () => {
    expect(analyticsSource).toContain("const GOOGLE_ANALYTICS_ID = 'G-Z704LCGF3P'");
    expect(analyticsSource).toContain('dreammakerhub-ga4-loader');
    expect(analyticsSource).toContain('dreammakerhub-ga4-init');
    expect(analyticsSource).toContain("gtag('config', '${GOOGLE_ANALYTICS_ID}')");
  });

  it('allows the GA script and collection endpoint in CSP', () => {
    expect(nextConfigSource).toContain('https://www.googletagmanager.com');
    expect(nextConfigSource).toContain('https://*.google-analytics.com');
  });
});
