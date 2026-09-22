-- Applied to production on 2026-09-21. A confirmed signup is queued only once.
create table if not exists public.onboarding_email_outbox (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 email text not null,
 template text not null default 'welcome',
 status text not null default 'pending' check (status in ('pending','processing','sent','failed')),
 attempts integer not null default 0,
 next_attempt_at timestamptz not null default now(),
 claimed_at timestamptz,
 sent_at timestamptz,
 provider_message_id text,
 last_error text,
 created_at timestamptz not null default now(),
 unique(user_id,template)
);
alter table public.onboarding_email_outbox enable row level security;
revoke all on public.onboarding_email_outbox from public, anon, authenticated;
create or replace function public.queue_confirmed_signup_welcome() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 if new.email is null or new.email_confirmed_at is null then return new; end if;
 if tg_op = 'INSERT' then
   insert into public.onboarding_email_outbox(user_id,email) values (new.id,new.email) on conflict(user_id,template) do nothing;
 elsif old.email_confirmed_at is null then
   insert into public.onboarding_email_outbox(user_id,email) values (new.id,new.email) on conflict(user_id,template) do nothing;
 end if;
 return new;
end; $$;
revoke all on function public.queue_confirmed_signup_welcome() from public, anon, authenticated;
drop trigger if exists trg_queue_confirmed_signup_welcome on auth.users;
create trigger trg_queue_confirmed_signup_welcome after insert or update of email_confirmed_at on auth.users for each row execute function public.queue_confirmed_signup_welcome();
create or replace function public.claim_one_welcome_email() returns setof public.onboarding_email_outbox language sql security definer set search_path = '' as $$
 with next_row as (
   select id from public.onboarding_email_outbox
   where ((status = 'pending' and next_attempt_at <= now()) or (status = 'processing' and claimed_at < now() - interval '10 minutes')) and attempts < 5
   order by created_at
   for update skip locked limit 1
 )
 update public.onboarding_email_outbox q
 set status='processing',claimed_at=now(),attempts=q.attempts+1
 from next_row where q.id=next_row.id
 returning q.*;
$$;
revoke all on function public.claim_one_welcome_email() from public, anon, authenticated;
grant execute on function public.claim_one_welcome_email() to service_role;
create index if not exists onboarding_email_outbox_dispatch_idx on public.onboarding_email_outbox(status,next_attempt_at,created_at);
