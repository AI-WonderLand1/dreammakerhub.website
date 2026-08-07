import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'WonderBuild AI Builder | AI Wonderland',
  description: 'Describe your idea and the AI builds it.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
