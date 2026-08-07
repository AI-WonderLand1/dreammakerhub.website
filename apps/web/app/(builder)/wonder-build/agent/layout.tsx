import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Agent | AI Wonderland',
  description: 'AI agents that build for you in WonderBuild.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
