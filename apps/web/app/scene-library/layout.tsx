import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Wonderland Scene Library',
  description: 'Browse the AI Wonderland scene library.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
