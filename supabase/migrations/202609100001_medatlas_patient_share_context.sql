begin;

-- Reports must be bound to a tenant-safe clinical workspace before they can
-- participate in a patient share. Existing rows remain readable, but a
-- published row without workspace context cannot create or resolve a share.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'clinical_workspaces_id_organization_key'
      and conrelid = 'public.clinical_workspaces'::regclass
  ) then
    alter table public.clinical_workspaces
      add constraint clinical_workspaces_id_organization_key
      unique (id, organization_id);
  end if;
end
$$;

alter table public.visual_reports
  add column if not exists workspace_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'visual_reports_workspace_org_fk'
      and conrelid = 'public.visual_reports'::regclass
  ) then
    alter table public.visual_reports
      add constraint visual_reports_workspace_org_fk
      foreign key (workspace_id, organization_id)
      references public.clinical_workspaces(id, organization_id)
      on delete restrict;
  end if;
end
$$;

create index if not exists visual_reports_workspace_idx
  on public.visual_reports (organization_id, workspace_id, updated_at desc);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'visual_reports_published_workspace_required'
      and conrelid = 'public.visual_reports'::regclass
  ) then
    alter table public.visual_reports
      add constraint visual_reports_published_workspace_required
      check (status <> 'published' or workspace_id is not null)
      not valid;
  end if;

  if not exists (
    select 1
    from public.visual_reports
    where status = 'published'
      and workspace_id is null
  ) then
    alter table public.visual_reports
      validate constraint visual_reports_published_workspace_required;
  end if;
end
$$;

-- The anonymous resolver receives this immutable patient-safe snapshot rather
-- than a clinical row. Existing shares without a snapshot fail closed.
alter table public.report_shares
  add column if not exists patient_snapshot jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'report_shares_patient_snapshot_object'
      and conrelid = 'public.report_shares'::regclass
  ) then
    alter table public.report_shares
      add constraint report_shares_patient_snapshot_object
      check (
        patient_snapshot is null
        or jsonb_typeof(patient_snapshot) = 'object'
      );
  end if;
end
$$;

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
  publication_time timestamptz;
  organization_name text;
  workspace_name text;
  brand_name text;
  patient_footer_text text;
  reviewer_display_name text;
  reviewer_specialty text;
  publisher_display_name text;
  publisher_specialty text;
  patient_snapshot jsonb;
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
     or report_row.workspace_id is null
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

  publication_time := now();

  if report_row.approved_at > publication_time then
    raise exception 'invalid_review_chronology';
  end if;

  select workspace.name
  into workspace_name
  from public.clinical_workspaces workspace
  where workspace.id = report_row.workspace_id
    and workspace.organization_id = report_row.organization_id
    and workspace.active = true;

  if not found then
    raise exception 'workspace_not_active';
  end if;

  select
    reviewer.display_name,
    reviewer.specialty
  into
    reviewer_display_name,
    reviewer_specialty
  from public.professionals reviewer
  where reviewer.organization_id = report_row.organization_id
    and reviewer.user_id = report_row.approved_by;

  if not found then
    raise exception 'reviewer_profile_required';
  end if;

  select
    publisher.display_name,
    publisher.specialty
  into
    publisher_display_name,
    publisher_specialty
  from public.professionals publisher
  where publisher.organization_id = report_row.organization_id
    and publisher.user_id = auth.uid();

  if not found then
    raise exception 'publisher_profile_required';
  end if;

  select
    organization.name,
    coalesce(branding.brand_name, organization.name),
    coalesce(
      branding.patient_footer_text,
      branding.brand_name,
      organization.name
    )
  into
    organization_name,
    brand_name,
    patient_footer_text
  from public.organizations organization
  left join public.organization_branding branding
    on branding.organization_id = organization.id
  where organization.id = report_row.organization_id;

  if not found then
    raise exception 'organization_not_found';
  end if;

  patient_snapshot := jsonb_build_object(
    'title', report_row.title,
    'status', 'published',
    'finding', jsonb_build_object(
      'sourceText', report_row.source_text,
      'anatomicalStructure', report_row.anatomical_structure,
      'atlasConceptId', report_row.atlas_concept_id,
      'anatomyReviewRequired', false,
      'patientExplanation', report_row.patient_explanation,
      'explanationReviewRequired', false,
      'clinicianNote', report_row.clinician_note
    ),
    'reviewApproval', jsonb_build_object(
      'approvedBy', jsonb_build_object(
        'displayName', reviewer_display_name,
        'specialty', reviewer_specialty
      ),
      'approvedAt', report_row.approved_at
    ),
    'publicationIdentity', jsonb_build_object(
      'organizationName', organization_name,
      'workspaceName', workspace_name,
      'branding', jsonb_build_object(
        'brandName', brand_name,
        'patientFooterText', patient_footer_text
      ),
      'professional', jsonb_build_object(
        'displayName', publisher_display_name,
        'specialty', publisher_specialty
      ),
      'publishedAt', publication_time
    )
  );

  raw_token := encode(gen_random_bytes(32), 'hex');
  share_expiry := publication_time + p_ttl;

  insert into public.report_shares (
    organization_id,
    report_id,
    report_version,
    token_hash,
    expires_at,
    created_by,
    patient_snapshot
  )
  values (
    report_row.organization_id,
    report_row.id,
    report_row.version,
    digest(raw_token, 'sha256'),
    share_expiry,
    auth.uid(),
    patient_snapshot
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
      'workspace_id', report_row.workspace_id,
      'expires_at', share_expiry
    )
  );

  return query select raw_token, share_expiry;
end
$$;

revoke all on function public.medatlas_create_report_share(uuid, interval) from public;
grant execute on function public.medatlas_create_report_share(uuid, interval)
  to authenticated;

create or replace function public.medatlas_revoke_report_shares(
  p_report_id uuid
)
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  report_organization_id uuid;
  revoked_count integer := 0;
begin
  if auth.uid() is null then
    raise exception 'authentication_required';
  end if;

  select report.organization_id
  into report_organization_id
  from public.visual_reports report
  where report.id = p_report_id;

  if not found then
    raise exception 'report_not_found';
  end if;

  if not public.medatlas_can_write_clinical(report_organization_id) then
    raise exception 'not_authorized';
  end if;

  update public.report_shares share
  set revoked_at = now()
  where share.organization_id = report_organization_id
    and share.report_id = p_report_id
    and share.revoked_at is null
    and share.expires_at > now();

  get diagnostics revoked_count = row_count;

  if revoked_count > 0 then
    insert into public.audit_events (
      organization_id,
      actor_user_id,
      event_type,
      subject_type,
      subject_id,
      metadata
    )
    values (
      report_organization_id,
      auth.uid(),
      'report.shares_revoked',
      'visual_report',
      p_report_id,
      jsonb_build_object('revoked_count', revoked_count)
    );
  end if;

  return revoked_count;
end
$$;

revoke all on function public.medatlas_revoke_report_shares(uuid) from public;
grant execute on function public.medatlas_revoke_report_shares(uuid)
  to authenticated;

-- Return type changes from clinical columns to the single patient-safe
-- projection, so PostgreSQL requires dropping the previous function first.
drop function if exists public.medatlas_resolve_report_share(text);

create function public.medatlas_resolve_report_share(
  p_token text
)
returns table (
  patient_report jsonb,
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
    and patient_snapshot is not null
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
    and workspace_id is not null
    and anatomy_review_required = false
    and explanation_review_required = false
    and approved_by is not null
    and approved_at is not null
    and version = share_row.report_version;

  if not found then
    return;
  end if;

  if jsonb_typeof(share_row.patient_snapshot) <> 'object'
     or share_row.patient_snapshot ->> 'status' <> 'published'
     or not (share_row.patient_snapshot ? 'title')
     or not (share_row.patient_snapshot ? 'finding')
     or not (share_row.patient_snapshot ? 'reviewApproval')
     or not (share_row.patient_snapshot ? 'publicationIdentity') then
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
      'share_id', share_row.id,
      'workspace_id', report_row.workspace_id
    )
  );

  return query
  select
    share_row.patient_snapshot,
    share_row.expires_at;
end
$$;

revoke all on function public.medatlas_resolve_report_share(text) from public;
grant execute on function public.medatlas_resolve_report_share(text)
  to anon, authenticated;

commit;
