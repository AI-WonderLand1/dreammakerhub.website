import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Careers | AI Wonderland',
  description: 'Join the Spatial Platform team.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
