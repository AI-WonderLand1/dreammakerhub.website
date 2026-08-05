import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Scene | AI Wonderland',
  description: 'View an interactive 3D scene.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
