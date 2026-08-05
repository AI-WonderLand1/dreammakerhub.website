import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog & Updates | AI Wonderland',
  description: 'News, updates, and tutorials from AI Wonderland.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
