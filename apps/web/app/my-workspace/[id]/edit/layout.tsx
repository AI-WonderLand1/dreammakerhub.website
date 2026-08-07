import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Edit Workspace | AI Wonderland',
  description: 'Edit your 3D workspace.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
