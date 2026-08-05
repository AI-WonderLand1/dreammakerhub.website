import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Agents & Workers | AI Wonderland',
  description: 'Manage AI agents, runners, and workers.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
