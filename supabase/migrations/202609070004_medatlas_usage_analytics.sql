begin;

create or replace function public.medatlas_get_usage_summary(
  p_organization_id uuid,
  p_since timestamptz default now() - interval '30 days'
)
returns table (
  published_reports bigint,
  shares_created bigint,
  active_shares bigint,
  share_views bigint,
  viewed_reports bigint,
  last_viewed_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication_required';
  end if;

  if not public.medatlas_is_org_member(p_organization_id) then
    raise exception 'not_authorized';
  end if;

  if p_since is null or p_since > now() then
    raise exception 'invalid_since';
  end if;

  return query
  select
    (
      select count(*)
      from public.visual_reports report
      where report.organization_id = p_organization_id
        and report.status = 'published'
        and report.created_at >= p_since
    )::bigint,
    (
      select count(*)
      from public.report_shares share
      where share.organization_id = p_organization_id
        and share.created_at >= p_since
    )::bigint,
    (
      select count(*)
      from public.report_shares share
      where share.organization_id = p_organization_id
        and share.revoked_at is null
        and share.expires_at > now()
    )::bigint,
    (
      select count(*)
      from public.audit_events event
      where event.organization_id = p_organization_id
        and event.event_type = 'report.share_viewed'
        and event.occurred_at >= p_since
    )::bigint,
    (
      select count(distinct event.subject_id)
      from public.audit_events event
      where event.organization_id = p_organization_id
        and event.event_type = 'report.share_viewed'
        and event.occurred_at >= p_since
        and event.subject_id is not null
    )::bigint,
    (
      select max(event.occurred_at)
      from public.audit_events event
      where event.organization_id = p_organization_id
        and event.event_type = 'report.share_viewed'
        and event.occurred_at >= p_since
    );
end
$$;

revoke all on function public.medatlas_get_usage_summary(uuid, timestamptz)
  from public;
grant execute
  on function public.medatlas_get_usage_summary(uuid, timestamptz)
  to authenticated;

create or replace function public.medatlas_get_report_view_stats(
  p_organization_id uuid,
  p_since timestamptz default now() - interval '30 days'
)
returns table (
  report_id uuid,
  report_title text,
  report_version integer,
  shares_created bigint,
  view_count bigint,
  last_viewed_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication_required';
  end if;

  if not public.medatlas_is_org_member(p_organization_id) then
    raise exception 'not_authorized';
  end if;

  if p_since is null or p_since > now() then
    raise exception 'invalid_since';
  end if;

  return query
  with share_counts as (
    select
      share.report_id,
      max(share.report_version) as report_version,
      count(*)::bigint as shares_created
    from public.report_shares share
    where share.organization_id = p_organization_id
      and share.created_at >= p_since
    group by share.report_id
  ),
  view_counts as (
    select
      event.subject_id as report_id,
      count(*)::bigint as view_count,
      max(event.occurred_at) as last_viewed_at
    from public.audit_events event
    where event.organization_id = p_organization_id
      and event.event_type = 'report.share_viewed'
      and event.occurred_at >= p_since
      and event.subject_id is not null
    group by event.subject_id
  )
  select
    report.id,
    report.title,
    coalesce(share_counts.report_version, report.version),
    coalesce(share_counts.shares_created, 0)::bigint,
    coalesce(view_counts.view_count, 0)::bigint,
    view_counts.last_viewed_at
  from public.visual_reports report
  left join share_counts on share_counts.report_id = report.id
  left join view_counts on view_counts.report_id = report.id
  where report.organization_id = p_organization_id
    and (
      share_counts.report_id is not null
      or view_counts.report_id is not null
    )
  order by
    view_counts.last_viewed_at desc nulls last,
    report.updated_at desc;
end
$$;

revoke all on function public.medatlas_get_report_view_stats(uuid, timestamptz)
  from public;
grant execute
  on function public.medatlas_get_report_view_stats(uuid, timestamptz)
  to authenticated;

commit;
