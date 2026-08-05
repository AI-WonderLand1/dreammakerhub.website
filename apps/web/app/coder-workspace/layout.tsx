import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cloud Development Workspace | AI Wonderland',
  description: 'Code in your private cloud development workspace.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
