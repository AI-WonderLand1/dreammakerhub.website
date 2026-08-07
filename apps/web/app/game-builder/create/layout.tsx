import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create a Game | AI Wonderland',
  description: 'Create a game with the AI game builder.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
