import { logger } from '@/lib/logger';
export const metadata = {
  title: 'Notifications | AI Wonderland',
  description: 'Configure how and when you receive notifications.',
};

export default function NotificationsSettingsPage() {
  return (
    <section>
      <h1>Notifications</h1>
      <p>Control how Wonderland notifies you about activity, mentions, and updates.</p>
    </section>
  );
}
