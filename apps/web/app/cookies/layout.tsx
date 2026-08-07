import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy | AI Wonderland',
  description: 'How AI Wonderland uses cookies.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
