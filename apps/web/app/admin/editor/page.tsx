import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Admin Content Editor | AI Wonderland',
  description: 'Manage your website content and pages.',
};

export const dynamic = 'force-dynamic';

export default function AdminEditorPage() {
  redirect('/wonder-build');
}
