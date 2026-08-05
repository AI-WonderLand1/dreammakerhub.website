import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Coder Settings | AI Wonderland',
  description: 'Manage your Coder workspaces.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
