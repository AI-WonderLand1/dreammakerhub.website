import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Analytics | AI Wonderland',
  description: 'Understand how your projects perform.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
