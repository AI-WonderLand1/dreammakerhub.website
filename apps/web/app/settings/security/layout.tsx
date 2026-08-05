import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Security | AI Wonderland',
  description: 'Keep your AI Wonderland account secure.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
