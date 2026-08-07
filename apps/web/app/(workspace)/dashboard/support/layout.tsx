import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Feedback & Support | AI Wonderland',
  description: 'Send feedback and report bugs.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
