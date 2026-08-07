import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connect Cloud Storage | AI Wonderland',
  description: 'Connect your cloud storage provider.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
