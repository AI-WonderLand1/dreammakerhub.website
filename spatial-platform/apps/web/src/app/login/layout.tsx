import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In | AI Wonderland',
  description: 'Sign in to Spatial Platform.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
