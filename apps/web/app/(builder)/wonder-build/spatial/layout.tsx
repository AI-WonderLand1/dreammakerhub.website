import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Spatial Designer | AI Wonderland',
  description: 'Design spatial worlds and experiences.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
