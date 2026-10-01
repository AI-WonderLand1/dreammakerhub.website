import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documentation',
  description:
    'Current AI WONDERLAND documentation for projects, WonderBuild, WonderSpace, AI, 3D, usage and credits, billing, marketplace, APIs, support, preview, and publishing.',
  alternates: {
    canonical: '/docs',
  },
  openGraph: {
    title: 'AI WONDERLAND Documentation',
    description:
      'Current guides for AI WONDERLAND projects, visual building, Railway-backed cloud IDE workspaces, AI, 3D, usage and billing, marketplace, APIs, support, and publishing.',
    url: 'https://dreammakerhub.website/docs',
    type: 'website',
  },
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
