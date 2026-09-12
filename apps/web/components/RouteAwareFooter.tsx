'use client';

import { usePathname } from 'next/navigation';
import Footer from '@/components/Footer';

/**
 * Marketing chrome should not leak into full-screen product surfaces such as
 * WonderBuild or the dedicated documentation center.
 */
export default function RouteAwareFooter() {
  const pathname = usePathname();

  const isWonderBuildWebsiteSurface =
    pathname === '/wonder-build' ||
    pathname.startsWith('/wonder-build/templates') ||
    pathname.startsWith('/wonder-build/builder') ||
    pathname.startsWith('/wonder-build/agent') ||
    pathname === '/builder' ||
    pathname.startsWith('/builder/');

  const isDocsSurface = pathname === '/docs' || pathname.startsWith('/docs/');

  if (isWonderBuildWebsiteSurface || isDocsSurface) return null;

  return <Footer />;
}
