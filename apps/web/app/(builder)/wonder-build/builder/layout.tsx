import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'WonderBuild Website Builder | AI Wonderland',
  description: 'Design, edit, preview, and publish websites with AI and drag-and-drop tools in WonderBuild.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
