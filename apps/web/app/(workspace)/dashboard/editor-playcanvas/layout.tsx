import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PlayCanvas Editor | AI Wonderland',
  description: 'Project setup and GLB import for PlayCanvas.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
