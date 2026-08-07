import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Wonderland Status',
  description: 'System status and uptime for AI Wonderland.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
