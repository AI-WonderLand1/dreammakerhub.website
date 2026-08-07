import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bring Your Own Cloud | AI Wonderland',
  description: 'Connect your own cloud providers.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
