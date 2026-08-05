import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Project | AI Wonderland',
  description: 'View and manage your project.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
