'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/supabase/auth-context';

export default function WonderPlayPage() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (user) {
      // Assuming the user object has an access_token property
      // Adjust this according to the actual user object structure from useAuth
      const token = user.access_token || '';
      const url = new URL('https://wonderplay-3d.dreammakerhub.website');
      if (token) {
        url.searchParams.set('token', token);
      }
      window.location.href = url.toString();
    } else {
      window.location.href = 'https://wonderplay-3d.dreammakerhub.website';
    }
  }, [user, loading]);

  return <div>Redirecting...</div>;
}
