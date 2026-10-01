import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documentation',
  description:
    'Step-by-step AI WONDERLAND documentation for signing in, starting a project, building, previewing, troubleshooting, and publishing.',
  alternates: {
    canonical: '/docs',
  },
  openGraph: {
    title: 'AI WONDERLAND Documentation',
    description:
      'Guides for signing in, starting projects, building, previewing, troubleshooting, and publishing with AI WONDERLAND.',
    url: 'https://dreammakerhub.website/docs',
    type: 'website',
  },
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
