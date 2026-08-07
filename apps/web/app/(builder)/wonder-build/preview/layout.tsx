import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'WonderBuild Preview | AI Wonderland',
  description: 'Preview your build before publishing.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
