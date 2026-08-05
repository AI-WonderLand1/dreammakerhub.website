import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Users | AI Wonderland',
  description: 'Manage user accounts.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
