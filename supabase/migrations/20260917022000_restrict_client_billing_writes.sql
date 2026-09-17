-- Stripe entitlements must be mutated only by trusted server code.
-- Applied to production via Supabase migration restrict_client_billing_writes.
revoke insert, update, delete, truncate, references, trigger
  on table public.subscriptions from anon, authenticated;
drop policy if exists "subscriptions: user write" on public.subscriptions;
grant select on table public.subscriptions to authenticated;

-- Keep ordinary self-service profile editing while protecting billing and usage.
revoke insert, update, delete, truncate, references, trigger
  on table public.profiles from anon, authenticated;
grant update (username, full_name, avatar_url, website, ssh_public_key,
  ssh_private_key_encrypted, ssh_key_generated_at)
  on table public.profiles to authenticated;
grant select on table public.profiles to authenticated;
-- service_role retains privileged writes for Stripe and account setup.