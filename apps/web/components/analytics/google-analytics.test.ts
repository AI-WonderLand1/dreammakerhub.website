import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const analyticsSource = readFileSync(resolve(__dirname, 'AmplitudeAnalytics.tsx'), 'utf8');
const nextConfigSource = readFileSync(resolve(__dirname, '../../next.config.mjs'), 'utf8');

describe('Google Analytics integration', () => {
  it('loads the requested GA4 measurement ID exactly once', () => {
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
