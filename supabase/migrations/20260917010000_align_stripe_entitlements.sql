-- Keep the repository schema aligned with the production Stripe entitlement model.

alter table public.subscriptions
  add column if not exists plan text,
  add column if not exists interval text;

alter table public.profiles
  add column if not exists stripe_customer_id text;

update public.profiles set subscription_tier = 'free' where subscription_tier in ('nomade', 'nomad');
update public.profiles set subscription_tier = 'pro' where subscription_tier = 'architect';
update public.profiles set subscription_tier = 'team' where subscription_tier = 'guild';

alter table public.profiles
  alter column subscription_tier set default 'free';

create index if not exists subscriptions_user_id_idx
  on public.subscriptions(user_id);

create unique index if not exists subscriptions_stripe_subscription_id_uidx
  on public.subscriptions(stripe_subscription_id)
  where stripe_subscription_id is not null;

create index if not exists profiles_stripe_customer_id_idx
  on public.profiles(stripe_customer_id)
  where stripe_customer_id is not null;
