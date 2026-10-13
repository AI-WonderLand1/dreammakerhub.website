-- Alice training data consent: strictly off by default.
-- Deploy this migration BEFORE enabling the UI/API; do not ingest customer
-- content until the separate consent-aware Librarian worker is implemented.
create table if not exists public.ai_training_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  consent_version text not null,
  source text not null check (source in ('signup', 'settings')),
  granted_at timestamptz,
  withdrawn_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint ai_training_grant_has_timestamp check (not enabled or granted_at is not null)
);

create table if not exists public.ai_training_consent_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  enabled boolean not null,
  consent_version text not null,
  source text not null check (source in ('signup', 'settings')),
  occurred_at timestamptz not null default now()
);
create index if not exists ai_training_consent_events_user_time
  on public.ai_training_consent_events (user_id, occurred_at desc);

alter table public.ai_training_preferences enable row level security;
alter table public.ai_training_consent_events enable row level security;
revoke all on public.ai_training_preferences from public, anon, authenticated;
revoke all on public.ai_training_consent_events from public, anon, authenticated;
grant select on public.ai_training_preferences to authenticated;

drop policy if exists ai_training_preferences_read_self on public.ai_training_preferences;
create policy ai_training_preferences_read_self on public.ai_training_preferences
  for select to authenticated using ((select auth.uid()) = user_id);

-- All writes go through this authenticated RPC, not client table mutations.
-- Enforce consent version and timestamps on the database, not browser input.
create or replace function public.set_ai_training_consent(p_enabled boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_version constant text := '2026-10-13-v1';
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;
  if p_enabled is null then
    raise exception 'A true or false choice is required';
  end if;

  insert into public.ai_training_preferences (
    user_id, enabled, consent_version, source,
    granted_at, withdrawn_at, updated_at
  )
  values (
    v_user_id, p_enabled, v_version, 'settings',
    case when p_enabled then now() else null end,
    case when p_enabled then null else now() end,
    now()
  )
  on conflict (user_id) do update
  set enabled = excluded.enabled,
      consent_version = excluded.consent_version,
      source = 'settings',
      granted_at = case when p_enabled then now() else public.ai_training_preferences.granted_at end,
      withdrawn_at = case when p_enabled then null else now() end,
      updated_at = now();

  insert into public.ai_training_consent_events (user_id, enabled, consent_version, source)
  values (v_user_id, p_enabled, v_version, 'settings');
end;
$$;
revoke all on function public.set_ai_training_consent(boolean) from public, anon;
grant execute on function public.set_ai_training_consent(boolean) to authenticated;

-- Signup metadata is an indication of a user's unchecked-by-default UI choice.
-- Never consume it directly for ingestion; the preference row is authoritative.
create or replace function public.record_signup_ai_training_consent()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.raw_user_meta_data ->> 'alice_training_opt_in' = 'true'
     and new.raw_user_meta_data ->> 'alice_training_consent_version' = '2026-10-13-v1' then
    insert into public.ai_training_preferences
      (user_id, enabled, consent_version, source, granted_at, updated_at)
    values (new.id, true, '2026-10-13-v1', 'signup', now(), now())
    on conflict (user_id) do nothing;

    insert into public.ai_training_consent_events
      (user_id, enabled, consent_version, source)
    values (new.id, true, '2026-10-13-v1', 'signup');
  end if;
  return new;
end;
$$;
revoke all on function public.record_signup_ai_training_consent() from public, anon, authenticated;
drop trigger if exists trg_record_signup_ai_training_consent on auth.users;
create trigger trg_record_signup_ai_training_consent
  after insert on auth.users for each row
  execute function public.record_signup_ai_training_consent();

-- Ingestion workers must use service_role and call this after checking
-- content ownership/rights, the project opt-in, and privacy restrictions.
-- A current, confirmed user-level opt-in is necessary but NOT sufficient.
create or replace function public.has_current_ai_training_consent(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.ai_training_preferences p
    join auth.users u on u.id = p.user_id
    where p.user_id = p_user_id
      and p.enabled is true
      and p.consent_version = '2026-10-13-v1'
      and u.email_confirmed_at is not null
  );
$$;
revoke all on function public.has_current_ai_training_consent(uuid) from public, anon, authenticated;
grant execute on function public.has_current_ai_training_consent(uuid) to service_role;
