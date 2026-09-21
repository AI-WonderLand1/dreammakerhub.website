-- Separate from Coder's workspace accounting. Only the service role can reserve or read.
create table if not exists public.managed_ide_workspaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (name ~ '^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$'),
  image_key text not null check (image_key in ('linux')),
  state text not null default 'reserved' check (state in ('reserved', 'provisioning', 'error', 'deleting', 'deleted')),
  storage_gib integer not null default 10 check (storage_gib = 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

alter table public.managed_ide_workspaces enable row level security;
revoke all on public.managed_ide_workspaces from public, anon, authenticated;
grant select, insert, update on public.managed_ide_workspaces to service_role;

create or replace function public.reserve_managed_ide_workspace(
  p_user_id uuid, p_name text, p_image_key text, p_limit integer
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_existing public.managed_ide_workspaces%rowtype;
  v_id uuid;
begin
  if p_user_id is null or p_name !~ '^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$'
     or p_image_key <> 'linux' or p_limit not between 1 and 5 then
    raise exception 'Invalid workspace request';
  end if;
  -- Serialize concurrent requests for one account before checking quota.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text, 0));
  select * into v_existing from public.managed_ide_workspaces
    where user_id = p_user_id and name = p_name;
  if found then
    if v_existing.state = 'deleted' or v_existing.image_key <> p_image_key then
      raise exception 'Workspace name unavailable';
    end if;
    return v_existing.id;
  end if;
  if (select count(*) from public.managed_ide_workspaces
      where user_id = p_user_id and state <> 'deleted') >= p_limit then
    raise exception 'Workspace allowance reached';
  end if;
  insert into public.managed_ide_workspaces (user_id, name, image_key)
    values (p_user_id, p_name, p_image_key) returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.reserve_managed_ide_workspace(uuid,text,text,integer) from public, anon, authenticated;
grant execute on function public.reserve_managed_ide_workspace(uuid,text,text,integer) to service_role;
