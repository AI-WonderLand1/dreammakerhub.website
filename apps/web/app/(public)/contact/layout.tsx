import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us | AI Wonderland',
  description: 'Get in touch with the AI Wonderland team.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
