'use client';

import { usePathname } from 'next/navigation';
import Footer from '@/components/Footer';

/**
 * Marketing chrome should not leak into full-screen WonderBuild website-builder
 * surfaces. Keep unrelated WonderPlay/3D routes unchanged.
 */
export default function RouteAwareFooter() {
  const pathname = usePathname();

  const isWonderBuildWebsiteSurface =
    pathname === '/wonder-build' ||
    pathname.startsWith('/wonder-build/builder') ||
    pathname.startsWith('/wonder-build/agent') ||
    pathname === '/builder' ||
    pathname.startsWith('/builder/');

  if (isWonderBuildWebsiteSurface) return null;

  return <Footer />;
}
