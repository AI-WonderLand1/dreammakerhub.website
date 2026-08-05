import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ | AI Wonderland',
  description: 'Frequently asked questions about AI Wonderland.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
