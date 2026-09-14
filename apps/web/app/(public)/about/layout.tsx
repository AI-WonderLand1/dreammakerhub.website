import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About DreamMakerHub',
  description:
    'Learn about DreamMakerHub, the founder-led AI WONDERLAND INNOVATION project building AI-assisted web, app, cloud, and 3D creation tools.',
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: 'About DreamMakerHub',
    description:
      'DreamMakerHub is a founder-led independent project building AI-assisted web, app, cloud, and 3D creation tools.',
    url: 'https://dreammakerhub.website/about',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
