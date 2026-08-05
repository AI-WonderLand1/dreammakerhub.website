import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Checkout | AI Wonderland',
  description: 'Complete your purchase securely.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
