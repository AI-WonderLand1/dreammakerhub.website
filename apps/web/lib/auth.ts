import { createClient } from "@/lib/supabase/client";

export interface AuthUser {
  id: string;
  email?: string;
  isPaid: boolean;
  plan: string | null;
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    isPaid: user.app_metadata?.plan === "pro",
    plan: user.app_metadata?.plan || null,
  };
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}
