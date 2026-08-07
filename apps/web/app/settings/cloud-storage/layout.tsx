import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cloud Storage | AI Wonderland',
  description: 'Manage your connected cloud storage.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
