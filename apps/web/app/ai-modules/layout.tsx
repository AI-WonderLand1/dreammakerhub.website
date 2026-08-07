import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Modules | AI Wonderland',
  description: 'Explore AI modules and bring-your-own-key providers.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
