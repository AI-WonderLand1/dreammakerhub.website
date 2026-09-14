import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact AI WONDERLAND INNOVATION',
  description:
    'Contact AI WONDERLAND INNOVATION for DreamMakerHub support, business inquiries, partnerships, general questions, or security reports.',
  alternates: {
    canonical: '/contact',
  },
  openGraph: {
    title: 'Contact AI WONDERLAND INNOVATION',
    description:
      'Official DreamMakerHub contact information for support, business inquiries, partnerships, and security reports.',
    url: 'https://dreammakerhub.website/contact',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
