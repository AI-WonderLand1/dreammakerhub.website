import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Subscription Plans | AI Wonderland',
  description: 'Choose the plan that fits your needs.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
