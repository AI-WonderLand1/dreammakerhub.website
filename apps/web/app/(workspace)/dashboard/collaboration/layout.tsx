import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Collaboration | AI Wonderland',
  description: 'Collaborate with your team in real time.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
