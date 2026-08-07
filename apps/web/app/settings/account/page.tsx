import { logger } from '@/lib/logger';
export const metadata = {
  title: 'Account Settings | AI Wonderland',
  description: 'Manage your profile, authentication, and sessions.',
};

export default function AccountSettingsPage() {
  return (
    <section>
      <h1>Account Settings</h1>
      <p>Manage your profile, authentication, sessions, and connected organizations.</p>

      <ul>
        <li>Public profile</li>
        <li>Emails</li>
        <li>Password and authentication</li>
        <li>Sessions</li>
        <li>SSH and GPG keys</li>
        <li>Organizations</li>
        <li>Enterprises</li>
      </ul>
    </section>
  );
}
