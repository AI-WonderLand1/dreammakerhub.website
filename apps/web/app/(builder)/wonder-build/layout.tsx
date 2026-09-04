import type { Metadata } from 'next';
import './wonderbuild-wow.css';
import './wonderbuild-builder-polish.css';
import './wonderbuild-template-polish.css';

export const metadata: Metadata = {
  title: 'WonderBuild | AI Wonderland',
  description: 'Create, visually edit, preview, and publish high-impact websites with AI-powered WonderBuild.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
