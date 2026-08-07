import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin User | AI Wonderland',
  description: 'Manage a user account.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
