import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Usage & Billing | AI Wonderland',
  description: 'Track usage and manage billing.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
