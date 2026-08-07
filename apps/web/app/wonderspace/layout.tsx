import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'WonderSpace | AI Wonderland',
  description: 'Your cloud space for AI Wonderland.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
