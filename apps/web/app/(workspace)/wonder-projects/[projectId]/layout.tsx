import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Wonder Project | AI Wonderland',
  description: 'View your WonderBuild project.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
