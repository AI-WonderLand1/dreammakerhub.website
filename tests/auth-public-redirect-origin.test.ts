import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const callback = readFileSync(join(process.cwd(), 'apps/web/app/api/auth/callback/route.ts'), 'utf8');

describe('public auth callback redirects', () => {
  it('uses the public site origin instead of a reverse proxy request URL', () => {
    expect(callback).toContain("const FALLBACK_PUBLIC_ORIGIN = 'https://dreammakerhub.website'");
    expect(callback).toContain("new URL('/public-pages/auth', publicAuthOrigin())");
    expect(callback).toContain('new URL(redirectTo, publicAuthOrigin())');
    expect(callback).not.toContain("new URL('/public-pages/auth', request.url)");
    expect(callback).not.toContain('new URL(redirectTo, request.url)');
  });

  it('rejects an internal or insecure configured public origin', () => {
    expect(callback).toContain("url.protocol === 'https:'");
    expect(callback).toContain("url.hostname !== '0.0.0.0'");
    expect(callback).toContain("url.hostname !== 'localhost'");
  });
});
