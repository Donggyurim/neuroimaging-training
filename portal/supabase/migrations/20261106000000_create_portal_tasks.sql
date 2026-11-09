create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  assigned_to_user_id text not null,
  assigned_to_username text not null,
  dataset_id text not null,
  subject_id text not null,
  notebook_url text not null,
  due_date date,
  status text not null default 'assigned' check (status in ('assigned', 'completed')),
  completed_at timestamptz,
  created_by_user_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_completion_state check (
    (status = 'assigned' and completed_at is null)
    or (status = 'completed' and completed_at is not null)
  ),
  constraint tasks_notebook_url_https check (notebook_url ~ '^https://')
);

create index tasks_assigned_to_user_id_idx on public.tasks (assigned_to_user_id);
create index tasks_status_idx on public.tasks (status);

alter table public.tasks enable row level security;
revoke all on table public.tasks from anon, authenticated;
grant select, insert, update, delete on table public.tasks to service_role;
