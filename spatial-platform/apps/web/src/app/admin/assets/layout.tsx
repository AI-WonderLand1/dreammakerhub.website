import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Assets | AI Wonderland',
  description: 'Manage 3D assets.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
