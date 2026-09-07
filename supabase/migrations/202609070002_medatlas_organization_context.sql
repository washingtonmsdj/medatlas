begin;

create table if not exists public.organization_units (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  slug text not null
    check (slug = lower(slug))
    check (slug ~ '^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]$'),
  city text,
  region text,
  country_code text check (
    country_code is null or country_code ~ '^[A-Z]{2}$'
  ),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug),
  unique (id, organization_id)
);

create table if not exists public.clinical_workspaces (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  unit_id uuid,
  name text not null check (char_length(name) between 2 and 120),
  slug text not null
    check (slug = lower(slug))
    check (slug ~ '^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]$'),
  specialty text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, unit_id, slug),
  foreign key (unit_id, organization_id)
    references public.organization_units(id, organization_id)
    on delete cascade
);

create index if not exists organization_units_org_idx
  on public.organization_units (organization_id, active, name);

create index if not exists clinical_workspaces_org_idx
  on public.clinical_workspaces (organization_id, active, name);

create index if not exists clinical_workspaces_unit_idx
  on public.clinical_workspaces (unit_id, active, name)
  where unit_id is not null;

drop trigger if exists organization_units_set_updated_at on public.organization_units;
create trigger organization_units_set_updated_at
before update on public.organization_units
for each row execute function public.medatlas_set_updated_at();

drop trigger if exists clinical_workspaces_set_updated_at on public.clinical_workspaces;
create trigger clinical_workspaces_set_updated_at
before update on public.clinical_workspaces
for each row execute function public.medatlas_set_updated_at();

create or replace function public.medatlas_is_org_admin(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.organization_members membership
    where membership.organization_id = target_org
      and membership.user_id = auth.uid()
      and membership.active = true
      and membership.role = 'admin'
  );
$$;

revoke all on function public.medatlas_is_org_admin(uuid) from public;
grant execute on function public.medatlas_is_org_admin(uuid) to authenticated;

alter table public.organization_units enable row level security;
alter table public.clinical_workspaces enable row level security;

drop policy if exists organization_units_select_org on public.organization_units;
create policy organization_units_select_org
on public.organization_units
for select
to authenticated
using (public.medatlas_is_org_member(organization_id));

drop policy if exists organization_units_admin_write on public.organization_units;
create policy organization_units_admin_write
on public.organization_units
for all
to authenticated
using (public.medatlas_is_org_admin(organization_id))
with check (public.medatlas_is_org_admin(organization_id));

drop policy if exists clinical_workspaces_select_org on public.clinical_workspaces;
create policy clinical_workspaces_select_org
on public.clinical_workspaces
for select
to authenticated
using (public.medatlas_is_org_member(organization_id));

drop policy if exists clinical_workspaces_admin_write on public.clinical_workspaces;
create policy clinical_workspaces_admin_write
on public.clinical_workspaces
for all
to authenticated
using (public.medatlas_is_org_admin(organization_id))
with check (
  public.medatlas_is_org_admin(organization_id)
  and (
    unit_id is null
    or exists (
      select 1
      from public.organization_units unit
      where unit.id = clinical_workspaces.unit_id
        and unit.organization_id = clinical_workspaces.organization_id
    )
  )
);

revoke all on table public.organization_units from anon, authenticated;
revoke all on table public.clinical_workspaces from anon, authenticated;

grant select, insert, update, delete on table public.organization_units to authenticated;
grant select, insert, update, delete on table public.clinical_workspaces to authenticated;

commit;
