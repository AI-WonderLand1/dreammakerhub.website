import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Logs | AI Wonderland',
  description: 'Audit logs for Spatial Platform.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
