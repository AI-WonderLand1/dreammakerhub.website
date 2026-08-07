import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Worlds | AI Wonderland',
  description: 'Explore the worlds of Spatial Platform.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
