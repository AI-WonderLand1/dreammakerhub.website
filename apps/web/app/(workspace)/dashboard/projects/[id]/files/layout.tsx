import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Project Files | AI Wonderland',
  description: 'Manage files for your project.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
