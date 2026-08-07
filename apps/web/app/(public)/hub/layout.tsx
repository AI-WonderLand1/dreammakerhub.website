import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hub | AI Wonderland',
  description: 'Start a new project from the AI Wonderland hub.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
