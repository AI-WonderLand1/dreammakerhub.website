import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Projects | AI Wonderland',
  description: 'All your AI Wonderland projects.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
