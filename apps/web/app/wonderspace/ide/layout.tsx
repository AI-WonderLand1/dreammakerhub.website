import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'WonderSpace IDE | AI Wonderland',
  description: 'Create your cloud workspace in WonderSpace IDE.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
