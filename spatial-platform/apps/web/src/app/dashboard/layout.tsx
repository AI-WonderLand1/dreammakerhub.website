import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | AI Wonderland',
  description: 'Your Spatial Platform dashboard.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
