import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PlayCanvas Scene Editor | AI Wonderland',
  description: 'Edit your 3D scene in the PlayCanvas editor.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
