import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Webhooks | AI Wonderland',
  description: 'Manage webhook integrations for your account.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
