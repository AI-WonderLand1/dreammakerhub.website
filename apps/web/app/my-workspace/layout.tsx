import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Your 3D Workspaces | AI Wonderland',
  description: 'Manage your 3D workspaces.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
