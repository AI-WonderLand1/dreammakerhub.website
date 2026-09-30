-- Wonderland customer API keys. Privileged server endpoints exclusively manage this table.
-- This migration adds a new table; it does not modify existing user_api_tokens.
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 64),
  prefix text not null unique,
  token_hash text not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz
);
create index if not exists api_keys_user_created_idx
  on public.api_keys(user_id, created_at desc);
create index if not exists api_keys_active_prefix_idx
  on public.api_keys(prefix) where revoked_at is null;
alter table public.api_keys enable row level security;
-- Intentionally no browser-facing policies: token hashes must never be readable
-- through a publishable/anon client, even by the owner.
revoke all on table public.api_keys from anon, authenticated;
grant select, insert, update on table public.api_keys to service_role;
