begin;

create extension if not exists pgcrypto with schema extensions;

do $$
begin
  create type public.medatlas_member_role as enum ('admin', 'clinician', 'staff');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.medatlas_report_status as enum (
    'draft',
    'clinician_review',
    'published',
    'archived'
  );
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  slug text not null unique
    check (slug = lower(slug))
    check (slug ~ '^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.medatlas_member_role not null default 'staff',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table if not exists public.professionals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 120),
  specialty text,
  license_region text,
  license_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 120),
  birth_year smallint check (
    birth_year is null or birth_year between 1900 and extract(year from now())::int
  ),
  external_reference text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (organization_id, external_reference)
);

create table if not exists public.consultations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete restrict,
  clinician_user_id uuid references auth.users(id) on delete set null,
  occurred_at timestamptz not null default now(),
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.visual_reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete restrict,
  consultation_id uuid references public.consultations(id) on delete set null,
  title text not null check (char_length(title) between 2 and 180),
  status public.medatlas_report_status not null default 'draft',

  source_text text not null default '',
  anatomical_structure text not null default '',
  atlas_ref text not null default 'BodyParts3D 4.0 / FMA',
  atlas_concept_id text not null default '',
  atlas_state jsonb not null default '{}'::jsonb,

  patient_explanation text not null default '',
  clinician_note text not null default '',
  anatomy_review_required boolean not null default true,
  explanation_review_required boolean not null default true,
  explanation_provenance jsonb not null default '{"origin":"manual","clinicianEdited":true}'::jsonb,

  version integer not null default 1 check (version > 0),
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,

  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (
    status <> 'published'
    or (
      anatomy_review_required = false
      and explanation_review_required = false
      and approved_by is not null
      and approved_at is not null
      and char_length(atlas_concept_id) > 0
      and char_length(patient_explanation) > 0
    )
  )
);

create table if not exists public.clinical_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  patient_id uuid references public.patients(id) on delete restrict,
  consultation_id uuid references public.consultations(id) on delete set null,
  storage_path text not null unique,
  original_filename text not null,
  content_type text not null,
  sha256_hex text not null check (sha256_hex ~ '^[0-9a-f]{64}$'),
  byte_size bigint not null check (byte_size >= 0),
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (storage_path like organization_id::text || '/%')
);

create table if not exists public.report_shares (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  report_id uuid not null references public.visual_reports(id) on delete cascade,
  report_version integer not null check (report_version > 0),
  token_hash bytea not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  last_viewed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (expires_at > created_at)
);

create table if not exists public.audit_events (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null check (char_length(event_type) between 3 and 100),
  subject_type text not null check (char_length(subject_type) between 2 and 80),
  subject_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists organization_members_user_idx
  on public.organization_members (user_id, organization_id)
  where active = true;

create index if not exists professionals_org_idx
  on public.professionals (organization_id);

create index if not exists patients_org_idx
  on public.patients (organization_id, created_at desc);

create index if not exists consultations_org_patient_idx
  on public.consultations (organization_id, patient_id, occurred_at desc);

create index if not exists visual_reports_org_patient_idx
  on public.visual_reports (organization_id, patient_id, updated_at desc);

create index if not exists visual_reports_consultation_idx
  on public.visual_reports (consultation_id)
  where consultation_id is not null;

create index if not exists clinical_documents_org_idx
  on public.clinical_documents (organization_id, created_at desc);

create index if not exists report_shares_report_idx
  on public.report_shares (report_id, created_at desc);

create index if not exists report_shares_active_idx
  on public.report_shares (expires_at)
  where revoked_at is null;

create index if not exists audit_events_org_time_idx
  on public.audit_events (organization_id, occurred_at desc);

create or replace function public.medatlas_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end
$$;

drop trigger if exists organizations_set_updated_at on public.organizations;
create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function public.medatlas_set_updated_at();

drop trigger if exists professionals_set_updated_at on public.professionals;
create trigger professionals_set_updated_at
before update on public.professionals
for each row execute function public.medatlas_set_updated_at();

drop trigger if exists patients_set_updated_at on public.patients;
create trigger patients_set_updated_at
before update on public.patients
for each row execute function public.medatlas_set_updated_at();

drop trigger if exists consultations_set_updated_at on public.consultations;
create trigger consultations_set_updated_at
before update on public.consultations
for each row execute function public.medatlas_set_updated_at();

drop trigger if exists visual_reports_set_updated_at on public.visual_reports;
create trigger visual_reports_set_updated_at
before update on public.visual_reports
for each row execute function public.medatlas_set_updated_at();

create or replace function public.medatlas_is_org_member(target_org uuid)
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
  );
$$;

create or replace function public.medatlas_can_write_clinical(target_org uuid)
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
      and membership.role in ('admin', 'clinician')
  );
$$;

revoke all on function public.medatlas_is_org_member(uuid) from public;
revoke all on function public.medatlas_can_write_clinical(uuid) from public;
grant execute on function public.medatlas_is_org_member(uuid) to authenticated;
grant execute on function public.medatlas_can_write_clinical(uuid) to authenticated;

create or replace function public.medatlas_create_organization(
  p_name text,
  p_slug text,
  p_professional_name text
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  new_org_id uuid;
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'authentication_required';
  end if;

  if p_slug <> lower(p_slug)
     or p_slug !~ '^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$' then
    raise exception 'invalid_organization_slug';
  end if;

  insert into public.organizations (name, slug)
  values (p_name, p_slug)
  returning id into new_org_id;

  insert into public.organization_members (
    organization_id,
    user_id,
    role
  )
  values (new_org_id, current_user_id, 'admin');

  insert into public.professionals (
    organization_id,
    user_id,
    display_name
  )
  values (new_org_id, current_user_id, p_professional_name);

  insert into public.audit_events (
    organization_id,
    actor_user_id,
    event_type,
    subject_type,
    subject_id
  )
  values (
    new_org_id,
    current_user_id,
    'organization.created',
    'organization',
    new_org_id
  );

  return new_org_id;
end
$$;

revoke all on function public.medatlas_create_organization(text, text, text) from public;
grant execute on function public.medatlas_create_organization(text, text, text)
  to authenticated;

create or replace function public.medatlas_create_report_share(
  p_report_id uuid,
  p_ttl interval default interval '7 days'
)
returns table (
  token text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public, extensions, auth
as $$
declare
  report_row public.visual_reports%rowtype;
  raw_token text;
  share_expiry timestamptz;
begin
  if auth.uid() is null then
    raise exception 'authentication_required';
  end if;

  select *
  into report_row
  from public.visual_reports
  where id = p_report_id;

  if not found then
    raise exception 'report_not_found';
  end if;

  if not public.medatlas_can_write_clinical(report_row.organization_id) then
    raise exception 'not_authorized';
  end if;

  if report_row.status <> 'published'
     or report_row.anatomy_review_required
     or report_row.explanation_review_required
     or report_row.approved_by is null
     or report_row.approved_at is null then
    raise exception 'report_not_publishable';
  end if;

  if p_ttl <= interval '5 minutes'
     or p_ttl > interval '30 days' then
    raise exception 'invalid_share_ttl';
  end if;

  raw_token := encode(gen_random_bytes(32), 'hex');
  share_expiry := now() + p_ttl;

  insert into public.report_shares (
    organization_id,
    report_id,
    report_version,
    token_hash,
    expires_at,
    created_by
  )
  values (
    report_row.organization_id,
    report_row.id,
    report_row.version,
    digest(raw_token, 'sha256'),
    share_expiry,
    auth.uid()
  );

  insert into public.audit_events (
    organization_id,
    actor_user_id,
    event_type,
    subject_type,
    subject_id,
    metadata
  )
  values (
    report_row.organization_id,
    auth.uid(),
    'report.share_created',
    'visual_report',
    report_row.id,
    jsonb_build_object(
      'report_version', report_row.version,
      'expires_at', share_expiry
    )
  );

  return query select raw_token, share_expiry;
end
$$;

revoke all on function public.medatlas_create_report_share(uuid, interval) from public;
grant execute on function public.medatlas_create_report_share(uuid, interval)
  to authenticated;

create or replace function public.medatlas_resolve_report_share(
  p_token text
)
returns table (
  report_id uuid,
  title text,
  anatomical_structure text,
  atlas_ref text,
  atlas_concept_id text,
  atlas_state jsonb,
  source_text text,
  patient_explanation text,
  clinician_note text,
  report_version integer,
  share_expires_at timestamptz
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  share_row public.report_shares%rowtype;
  report_row public.visual_reports%rowtype;
begin
  if p_token is null
     or char_length(p_token) < 32
     or char_length(p_token) > 256 then
    return;
  end if;

  select *
  into share_row
  from public.report_shares
  where token_hash = digest(p_token, 'sha256')
    and revoked_at is null
    and expires_at > now()
  limit 1;

  if not found then
    return;
  end if;

  select *
  into report_row
  from public.visual_reports
  where id = share_row.report_id
    and organization_id = share_row.organization_id
    and status = 'published'
    and anatomy_review_required = false
    and explanation_review_required = false
    and version = share_row.report_version;

  if not found then
    return;
  end if;

  update public.report_shares
  set last_viewed_at = now()
  where id = share_row.id;

  insert into public.audit_events (
    organization_id,
    actor_user_id,
    event_type,
    subject_type,
    subject_id,
    metadata
  )
  values (
    report_row.organization_id,
    null,
    'report.share_viewed',
    'visual_report',
    report_row.id,
    jsonb_build_object(
      'report_version', report_row.version,
      'share_id', share_row.id
    )
  );

  return query
  select
    report_row.id,
    report_row.title,
    report_row.anatomical_structure,
    report_row.atlas_ref,
    report_row.atlas_concept_id,
    report_row.atlas_state,
    report_row.source_text,
    report_row.patient_explanation,
    report_row.clinician_note,
    report_row.version,
    share_row.expires_at;
end
$$;

revoke all on function public.medatlas_resolve_report_share(text) from public;
grant execute on function public.medatlas_resolve_report_share(text)
  to anon, authenticated;

create or replace function public.medatlas_storage_org_id(object_name text)
returns uuid
language plpgsql
immutable
set search_path = public
as $$
declare
  first_segment text;
begin
  first_segment := split_part(object_name, '/', 1);

  if first_segment ~
    '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    return first_segment::uuid;
  end if;

  return null;
end
$$;

revoke all on function public.medatlas_storage_org_id(text) from public;
grant execute on function public.medatlas_storage_org_id(text)
  to authenticated;

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.professionals enable row level security;
alter table public.patients enable row level security;
alter table public.consultations enable row level security;
alter table public.visual_reports enable row level security;
alter table public.clinical_documents enable row level security;
alter table public.report_shares enable row level security;
alter table public.audit_events enable row level security;

drop policy if exists organizations_select_member on public.organizations;
create policy organizations_select_member
on public.organizations
for select
to authenticated
using (public.medatlas_is_org_member(id));

drop policy if exists organization_members_select_org on public.organization_members;
create policy organization_members_select_org
on public.organization_members
for select
to authenticated
using (public.medatlas_is_org_member(organization_id));

drop policy if exists organization_members_admin_write on public.organization_members;
create policy organization_members_admin_write
on public.organization_members
for all
to authenticated
using (
  exists (
    select 1
    from public.organization_members self_membership
    where self_membership.organization_id = organization_members.organization_id
      and self_membership.user_id = auth.uid()
      and self_membership.active = true
      and self_membership.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.organization_members self_membership
    where self_membership.organization_id = organization_members.organization_id
      and self_membership.user_id = auth.uid()
      and self_membership.active = true
      and self_membership.role = 'admin'
  )
);

drop policy if exists professionals_select_org on public.professionals;
create policy professionals_select_org
on public.professionals
for select
to authenticated
using (public.medatlas_is_org_member(organization_id));

drop policy if exists professionals_write_clinical on public.professionals;
create policy professionals_write_clinical
on public.professionals
for all
to authenticated
using (public.medatlas_can_write_clinical(organization_id))
with check (public.medatlas_can_write_clinical(organization_id));

drop policy if exists patients_select_org on public.patients;
create policy patients_select_org
on public.patients
for select
to authenticated
using (public.medatlas_is_org_member(organization_id));

drop policy if exists patients_write_clinical on public.patients;
create policy patients_write_clinical
on public.patients
for all
to authenticated
using (public.medatlas_can_write_clinical(organization_id))
with check (public.medatlas_can_write_clinical(organization_id));

drop policy if exists consultations_select_org on public.consultations;
create policy consultations_select_org
on public.consultations
for select
to authenticated
using (public.medatlas_is_org_member(organization_id));

drop policy if exists consultations_write_clinical on public.consultations;
create policy consultations_write_clinical
on public.consultations
for all
to authenticated
using (public.medatlas_can_write_clinical(organization_id))
with check (public.medatlas_can_write_clinical(organization_id));

drop policy if exists visual_reports_select_org on public.visual_reports;
create policy visual_reports_select_org
on public.visual_reports
for select
to authenticated
using (public.medatlas_is_org_member(organization_id));

drop policy if exists visual_reports_write_clinical on public.visual_reports;
create policy visual_reports_write_clinical
on public.visual_reports
for all
to authenticated
using (public.medatlas_can_write_clinical(organization_id))
with check (public.medatlas_can_write_clinical(organization_id));

drop policy if exists clinical_documents_select_org on public.clinical_documents;
create policy clinical_documents_select_org
on public.clinical_documents
for select
to authenticated
using (public.medatlas_is_org_member(organization_id));

drop policy if exists clinical_documents_write_clinical on public.clinical_documents;
create policy clinical_documents_write_clinical
on public.clinical_documents
for all
to authenticated
using (public.medatlas_can_write_clinical(organization_id))
with check (public.medatlas_can_write_clinical(organization_id));

drop policy if exists report_shares_select_org on public.report_shares;
create policy report_shares_select_org
on public.report_shares
for select
to authenticated
using (public.medatlas_is_org_member(organization_id));

drop policy if exists report_shares_update_clinical on public.report_shares;
create policy report_shares_update_clinical
on public.report_shares
for update
to authenticated
using (public.medatlas_can_write_clinical(organization_id))
with check (public.medatlas_can_write_clinical(organization_id));

drop policy if exists audit_events_select_org on public.audit_events;
create policy audit_events_select_org
on public.audit_events
for select
to authenticated
using (public.medatlas_is_org_member(organization_id));

revoke all on table public.organizations from anon, authenticated;
revoke all on table public.organization_members from anon, authenticated;
revoke all on table public.professionals from anon, authenticated;
revoke all on table public.patients from anon, authenticated;
revoke all on table public.consultations from anon, authenticated;
revoke all on table public.visual_reports from anon, authenticated;
revoke all on table public.clinical_documents from anon, authenticated;
revoke all on table public.report_shares from anon, authenticated;
revoke all on table public.audit_events from anon, authenticated;

grant select on table public.organizations to authenticated;
grant select, insert, update, delete on table public.organization_members to authenticated;
grant select, insert, update, delete on table public.professionals to authenticated;
grant select, insert, update, delete on table public.patients to authenticated;
grant select, insert, update, delete on table public.consultations to authenticated;
grant select, insert, update, delete on table public.visual_reports to authenticated;
grant select, insert, update, delete on table public.clinical_documents to authenticated;
grant select, update on table public.report_shares to authenticated;
grant select on table public.audit_events to authenticated;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'clinical-documents',
  'clinical-documents',
  false,
  20971520,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists medatlas_clinical_documents_read on storage.objects;
create policy medatlas_clinical_documents_read
on storage.objects
for select
to authenticated
using (
  bucket_id = 'clinical-documents'
  and public.medatlas_is_org_member(
    public.medatlas_storage_org_id(name)
  )
);

drop policy if exists medatlas_clinical_documents_insert on storage.objects;
create policy medatlas_clinical_documents_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'clinical-documents'
  and public.medatlas_can_write_clinical(
    public.medatlas_storage_org_id(name)
  )
);

drop policy if exists medatlas_clinical_documents_update on storage.objects;
create policy medatlas_clinical_documents_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'clinical-documents'
  and public.medatlas_can_write_clinical(
    public.medatlas_storage_org_id(name)
  )
)
with check (
  bucket_id = 'clinical-documents'
  and public.medatlas_can_write_clinical(
    public.medatlas_storage_org_id(name)
  )
);

drop policy if exists medatlas_clinical_documents_delete on storage.objects;
create policy medatlas_clinical_documents_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'clinical-documents'
  and public.medatlas_can_write_clinical(
    public.medatlas_storage_org_id(name)
  )
);

commit;
