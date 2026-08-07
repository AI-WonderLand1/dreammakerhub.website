import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Marketplace | AI Wonderland',
  description: 'Discover assets and tools in the marketplace.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
