begin;

create table if not exists public.organization_branding (
  organization_id uuid primary key
    references public.organizations(id) on delete cascade,
  brand_name text not null
    check (char_length(brand_name) between 2 and 120),
  mark_text text not null
    check (char_length(mark_text) between 1 and 4),
  primary_color_hex text not null default '#1E7AD7'
    check (primary_color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  patient_footer_text text
    check (
      patient_footer_text is null
      or char_length(patient_footer_text) between 2 and 180
    ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists organization_branding_set_updated_at
  on public.organization_branding;
create trigger organization_branding_set_updated_at
before update on public.organization_branding
for each row execute function public.medatlas_set_updated_at();

alter table public.organization_branding enable row level security;

drop policy if exists organization_branding_select_org
  on public.organization_branding;
create policy organization_branding_select_org
on public.organization_branding
for select
to authenticated
using (public.medatlas_is_org_member(organization_id));

drop policy if exists organization_branding_admin_write
  on public.organization_branding;
create policy organization_branding_admin_write
on public.organization_branding
for all
to authenticated
using (public.medatlas_is_org_admin(organization_id))
with check (public.medatlas_is_org_admin(organization_id));

revoke all on table public.organization_branding from anon, authenticated;
grant select, insert, update, delete
  on table public.organization_branding
  to authenticated;

commit;
