import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Welcome | AI Wonderland',
  description: 'Welcome to AI Wonderland.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
