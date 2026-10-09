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

  // Match the IDE's fixed galaxy backdrop so translucent footer shards reveal
  // the same visual environment instead of an unrelated opaque black block.
  if (/^\/dashboard\/projects\/[^/]+\/ide\/?$/.test(pathname)) {
    return (
      <div
        className="bg-cover bg-center"
        style={{
          backgroundImage: "linear-gradient(rgba(4, 8, 20, 0.72), rgba(4, 10, 24, 0.82)), url('/images/wonderspace-galaxy.webp')",
          backgroundAttachment: "fixed",
        }}
      >
        <Footer />
      </div>
    );
  }

  return <Footer />;
}
