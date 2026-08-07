import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '3D Library | AI Wonderland',
  description: 'Browse the AI Wonderland 3D asset library.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
