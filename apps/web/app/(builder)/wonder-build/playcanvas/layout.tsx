import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Scene Templates | AI Wonderland',
  description: 'Start from a ready-made 3D scene template.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
