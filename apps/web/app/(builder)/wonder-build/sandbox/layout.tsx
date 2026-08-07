import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'WonderBuild Sandbox | AI Wonderland',
  description: 'Experiment safely in the WonderBuild sandbox.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
