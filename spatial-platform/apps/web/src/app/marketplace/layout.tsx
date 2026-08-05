import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Marketplace | AI Wonderland',
  description: 'Discover and share 3D content.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
