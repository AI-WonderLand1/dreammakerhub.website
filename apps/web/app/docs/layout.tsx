import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documentation | DreamMakerHub',
  description:
    'Step-by-step DreamMakerHub documentation for signing in, starting a project, building, previewing, troubleshooting, and publishing.',
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
