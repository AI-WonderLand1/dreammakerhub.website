import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tutorials | AI Wonderland',
  description: 'Step-by-step tutorials for AI Wonderland.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
