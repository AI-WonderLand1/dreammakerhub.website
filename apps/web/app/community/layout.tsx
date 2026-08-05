import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community | AI Wonderland',
  description: 'Join the AI Wonderland community.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
