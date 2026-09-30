import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";

function adminClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "").trim();
  const key = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function resolveStripeCustomer(user: User, options?: { createIfMissing?: boolean }) {
  const supabase = adminClient();
  if (!supabase) throw new Error("Billing database is unavailable");
  if (!stripe) throw new Error("Billing processor is unavailable");

  const [{ data: profile }, { data: subscription }] = await Promise.all([
    supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  let customerId = profile?.stripe_customer_id || subscription?.stripe_customer_id || null;

  if (!customerId && options?.createIfMissing) {
    const customer = await stripe.customers.create({
      email: user.email || undefined,
      metadata: { dreammakerhubUserId: user.id },
    });
    customerId = customer.id;

    const { error } = await supabase
      .from("profiles")
      .update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    if (error) throw error;
  }

  return { customerId, supabase };
}
