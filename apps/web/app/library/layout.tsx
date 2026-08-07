import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Scene Library | AI Wonderland',
  description: 'Browse scenes in the AI Wonderland library.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
