import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Worlds | AI Wonderland',
  description: 'Manage published worlds.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
