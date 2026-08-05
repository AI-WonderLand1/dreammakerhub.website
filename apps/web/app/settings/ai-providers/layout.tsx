import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Providers | AI Wonderland',
  description: 'Manage AI providers and API keys.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
