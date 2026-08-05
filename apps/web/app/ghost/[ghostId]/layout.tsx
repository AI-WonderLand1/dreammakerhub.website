import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ghost | AI Wonderland',
  description: 'View your Ghost AI experience.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
