import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Applications | AI Wonderland',
  description: 'Review job applications.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
