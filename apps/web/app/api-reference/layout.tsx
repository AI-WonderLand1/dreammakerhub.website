import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API Reference | AI Wonderland',
  description: 'Reference documentation for the AI Wonderland API.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
