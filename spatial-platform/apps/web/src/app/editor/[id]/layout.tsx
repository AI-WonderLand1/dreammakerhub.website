import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'World Editor | AI Wonderland',
  description: 'Edit your 3D world.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
