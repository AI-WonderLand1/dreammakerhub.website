import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Listings | AI Wonderland',
  description: 'Manage marketplace listings.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
