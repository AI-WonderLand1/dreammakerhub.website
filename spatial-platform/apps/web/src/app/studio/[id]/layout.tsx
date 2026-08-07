import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Studio | AI Wonderland',
  description: 'Build worlds in Spatial Platform Studio.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
