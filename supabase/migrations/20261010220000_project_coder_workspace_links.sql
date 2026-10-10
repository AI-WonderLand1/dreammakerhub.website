-- A workspace can be linked to multiple projects. A project can have several
-- workspaces owned by the same user. No filesystem mutation is performed here.
create table if not exists public.project_coder_workspace_links (
  project_id text not null references public._projects(id) on delete cascade,
  slot_id uuid not null references public.coder_workspace_slots(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, slot_id)
);

create index if not exists project_coder_workspace_links_slot_idx
  on public.project_coder_workspace_links(slot_id);

alter table public.project_coder_workspace_links enable row level security;
-- Deliberately no browser-facing policies. All access through owner-checked,
-- server-only authenticated endpoints. Do not expose service credentials.
