<<<<<<< HEAD
import { createClient } from "@/lib/supabase/client";

=======
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
export interface AuthUser {
  id: string;
  email?: string;
  isPaid: boolean;
  plan: string | null;
}

export async function getAuthUser(): Promise<AuthUser | null> {
<<<<<<< HEAD
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    isPaid: user.app_metadata?.plan === "pro",
    plan: user.app_metadata?.plan || null,
  };
=======
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
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthUser();
<<<<<<< HEAD
  if (!user) {
    throw new Error("Authentication required");
  }
=======
  if (!user) throw new Error("Authentication required");
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
  return user;
}
