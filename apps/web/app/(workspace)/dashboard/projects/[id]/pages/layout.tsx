import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Published Pages | AI Wonderland',
  description: 'Pages published from your project.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
