import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About | AI Wonderland',
  description: 'Learn about AI Wonderland and our mission.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
