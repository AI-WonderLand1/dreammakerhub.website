import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('F6S Follow badge placement', () => {
  it('uses the submitted F6S profile and official image with accessible link safety', () => {
    const badge = read('apps/web/components/F6SFollowBadge.tsx');
    expect(badge).toContain('https://www.f6s.com/member/michael-waite1?follow=1');
    expect(badge).toContain('https://www.f6s.com/images/f6s-follow-secondary.png');
    expect(badge).toContain('rel="noopener noreferrer"');
    expect(badge).toContain('aria-label=');
    expect(badge).toContain('width={78}');
    expect(badge).toContain('height={22}');
  });

  it('renders the badge in the shared footer', () => {
    const footer = read('apps/web/components/Footer.tsx');
    expect(footer).toContain('import F6SFollowBadge');
    expect(footer).toContain('<F6SFollowBadge />');
  });

  it('renders the badge in the community page sidebar', () => {
    const community = read('apps/web/app/community/page.tsx');
    expect(community).toContain('import F6SFollowBadge');
    expect(community).toContain('Follow our founder');
    expect(community).toContain('<F6SFollowBadge />');
  });
});
