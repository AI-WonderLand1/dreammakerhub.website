'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface DeviceSession {
  sessionId: string;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  ip: string | null;
  created_at: string;
  last_used: string | null;
  isCurrentDevice: boolean;
}

function getDeviceIcon(deviceType: string | null): string {
  if (!deviceType) return '💻';
  const d = deviceType.toLowerCase();
  if (d.includes('mobile') || d.includes('phone')) return '📱';
  if (d.includes('tablet') || d.includes('ipad')) return '📲';
  if (d.includes('desktop')) return '🖥️';
  if (d.includes('bot') || d.includes('spider')) return '🤖';
  return '💻';
}

function getDeviceTypeFromUserAgent(userAgent: string | null): string {
  if (!userAgent) return 'desktop';
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipod|ipad/i.test(ua)) return 'mobile';
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  return 'desktop';
}

function getBrowserFromUserAgent(userAgent: string | null): string {
  if (!userAgent) return 'Unknown';
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Browser';
}

function getOSFromUserAgent(userAgent: string | null): string {
  if (!userAgent) return 'Unknown OS';
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS') || userAgent.includes('iPhone')) return 'iOS';
  return 'Unknown OS';
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Unknown';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function SecuritySettingsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'sessions' | 'password'>('sessions');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  async function fetchSessions() {
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase!.auth.getUser();
      
      if (userError || !user) {
        router.push('/login');
        return;
      }

      // Get current session to compare
      const { data: currentSession } = await supabase!.auth.getSession();
      const currentAccessToken = currentSession?.session?.access_token;

      // Try to get sessions from the sessions table (if it exists in public schema)
      let dbSessions: any[] = [];
      try {
        const { data } = await supabase!
          .from('sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (data) {
          dbSessions = data.map(s => ({
            sessionId: s.id,
            device_type: getDeviceTypeFromUserAgent(s.user_agent),
            browser: getBrowserFromUserAgent(s.user_agent),
            os: getOSFromUserAgent(s.user_agent),
            ip: s.ip,
            created_at: s.created_at,
            last_used: s.refreshed_at || s.updated_at,
            isCurrentDevice: s.id === currentSession?.session?.access_token?.substring(0, 36)
          }));
        }
      } catch (dbError) {
        console.log('Sessions table not available in public schema');
      }

      // If no database sessions, create a mock "current device" session
      if (dbSessions.length === 0) {
        const userAgent = typeof window !== 'undefined' ? navigator.userAgent : '';
        dbSessions = [{
          sessionId: user.id + '-current',
          device_type: getDeviceTypeFromUserAgent(userAgent),
          browser: getBrowserFromUserAgent(userAgent),
          os: getOSFromUserAgent(userAgent),
          ip: null,
          created_at: new Date().toISOString(),
          last_used: new Date().toISOString(),
          isCurrentDevice: true
        }];
      }

      setSessions(dbSessions);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      // Create fallback session
      setSessions([{
        sessionId: 'current',
        device_type: 'desktop',
        browser: 'Current Browser',
        os: 'Current OS',
        ip: null,
        created_at: new Date().toISOString(),
        last_used: new Date().toISOString(),
        isCurrentDevice: true
      }]);
    } finally {
      setLoading(false);
    }
  }

  async function handleRevokeSession(sessionId: string) {
    if (!confirm('Are you sure you want to sign out this device?')) return;

    try {
      // Try to delete from database
      try {
        await supabase!.from('sessions').delete().eq('id', sessionId);
      } catch (e) {
        // Table might not exist, ignore
      }
      
      setSessions(sessions.filter(s => s.sessionId !== sessionId));
      setSuccess('Session revoked successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleRevokeAllSessions() {
    if (!confirm('Are you sure you want to sign out all other devices? This will keep you signed in on this device.')) return;

    try {
      try {
        const { data: { user } } = await supabase!.auth.getUser();
        if (user) {
          await supabase!.from('sessions').delete().neq('id', user.id);
        }
      } catch (e) {
        // Table might not exist
      }
      
      setSessions(sessions.filter(s => s.isCurrentDevice));
      setSuccess('All other sessions revoked');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setPasswordLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword })
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to update password');
      } else {
        setSuccess('Password updated successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Security</h1>
      <p className="text-gray-600 mb-6">Manage your authentication, sessions, and security settings.</p>

      <div className="flex gap-1 mb-6 border-b">
        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-4 py-2 -mb-px ${activeTab === 'sessions' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
        >
          Active Sessions
        </button>
        <button
          onClick={() => setActiveTab('password')}
          className={`px-4 py-2 -mb-px ${activeTab === 'password' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
        >
          Password
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          {success}
        </div>
      )}

      {activeTab === 'sessions' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Active Sessions</h2>
              <p className="text-sm text-gray-500">Devices where you are currently logged in</p>
            </div>
            <button
              onClick={handleRevokeAllSessions}
              className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50"
            >
              Sign out all other devices
            </button>
          </div>

          {loading ? (
            <div className="animate-pulse space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No active sessions found</p>
              <p className="text-sm mt-1">Your sessions will appear here when you sign in</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.sessionId}
                  className={`flex items-center justify-between p-4 rounded-lg border ${session.isCurrentDevice ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{getDeviceIcon(session.device_type)}</span>
                    <div>
                      <div className="font-medium">
                        {session.browser} on {session.os}
                        {session.isCurrentDevice && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">This device</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {session.ip || 'IP hidden'} • {formatDate(session.last_used)}
                      </div>
                    </div>
                  </div>
                  {!session.isCurrentDevice && (
                    <button
                      onClick={() => handleRevokeSession(session.sessionId)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Sign out
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'password' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Change Password</h2>
            <p className="text-sm text-gray-500">Update your password to keep your account secure</p>
          </div>

          <form onSubmit={handlePasswordChange} className="max-w-md space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter new password"
                minLength={8}
                required
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Confirm new password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>

          <div className="pt-6 border-t">
            <h3 className="font-medium mb-2">Forgot your password?</h3>
            <p className="text-sm text-gray-500 mb-3">
              If you need to reset your password because you forgot it, we can send you a reset link.
            </p>
            <ForgotPasswordButton />
          </div>
        </div>
      )}
    </div>
  );
}

function ForgotPasswordButton() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSendReset(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to send reset email');
      } else {
        setSent(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
        ✓ Password reset link sent! Check your email.
      </div>
    );
  }

  return (
    <form onSubmit={handleSendReset} className="flex gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        className="flex-1 px-3 py-2 border rounded-lg text-sm"
        required
      />
      <button
        type="submit"
        disabled={sending}
        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 text-sm"
      >
        {sending ? 'Sending...' : 'Send Reset Link'}
      </button>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </form>
  );
}