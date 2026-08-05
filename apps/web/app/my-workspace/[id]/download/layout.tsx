import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Download & Install | AI Wonderland',
  description: 'Download and install your workspace.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
