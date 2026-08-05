import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Edit Project | AI Wonderland',
  description: 'Edit your project in the AI Wonderland builder.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
