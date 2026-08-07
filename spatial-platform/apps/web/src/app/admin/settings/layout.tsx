import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Settings | AI Wonderland',
  description: 'Configure Spatial Platform settings.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
