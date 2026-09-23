import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const analyticsSource = readFileSync(new URL('./AmplitudeAnalytics.tsx', import.meta.url), 'utf8');
const nextConfigSource = readFileSync(new URL('../../next.config.mjs', import.meta.url), 'utf8');

describe('Google Analytics integration', () => {
  it('loads the requested GA4 measurement ID only for the production domain', () => {
    expect(analyticsSource).toContain("const GOOGLE_ANALYTICS_ID = 'G-Z704LCGF3P'");
    expect(analyticsSource).toContain("process.env.NODE_ENV === 'production'");
    expect(analyticsSource).toContain('PRODUCTION_HOSTS.has(window.location.hostname)');
    expect(analyticsSource).toContain('dreammakerhub-ga4-loader');
    expect(analyticsSource).toContain('dreammakerhub-ga4-init');
  });

  it('does not send URLs containing user-authored query strings to Google', () => {
    expect(analyticsSource).toContain("send_page_view: false");
    expect(analyticsSource).toContain('window.location.origin + safePath');
    expect(analyticsSource).toContain('window.location.origin + pathname');
    expect(analyticsSource).toContain("page_referrer: ''");
  });

  it('allows the GA script and collection endpoint in CSP', () => {
    expect(nextConfigSource).toContain('https://www.googletagmanager.com');
    expect(nextConfigSource).toContain('https://*.google-analytics.com');
  });

  it('allows the Amplitude engagement SDK script in CSP', () => {
    expect(nextConfigSource).toContain('https://cdn.amplitude.com');
    expect(nextConfigSource).toContain('https://*.amplitude.com');
  });
});
