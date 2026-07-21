import { logger } from '@/lib/logger';
export interface AuthUser {
  id: string;
  email?: string;
  isPaid: boolean;
  plan: string | null;
}

export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const res = await fetch('/api/auth/session');
    const data = await res.json();
    if (!data?.user) return null;
    return {
      id: data.user.id,
      email: data.user.email,
      isPaid: true,
      plan: 'pro',
    };
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) throw new Error("Authentication required");
  return user;
}
