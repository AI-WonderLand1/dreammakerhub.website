import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Subscription | AI Wonderland',
  description: 'Manage your subscription plan.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
