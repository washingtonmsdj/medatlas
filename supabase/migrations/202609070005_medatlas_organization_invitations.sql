begin;

create table if not exists public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null
    check (email = lower(email))
    check (char_length(email) between 3 and 320)
    check (email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  role public.medatlas_member_role not null default 'staff',
  token_hash bytea not null unique,
  invited_by uuid not null references auth.users(id) on delete restrict,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check (expires_at > created_at),
  check (accepted_at is null or revoked_at is null),
  check (accepted_at is null or accepted_at >= created_at),
  check (revoked_at is null or revoked_at >= created_at)
);

create unique index if not exists organization_invitations_pending_email_idx
  on public.organization_invitations (organization_id, lower(email))
  where accepted_at is null and revoked_at is null;

create index if not exists organization_invitations_org_status_idx
  on public.organization_invitations (
    organization_id,
    expires_at desc,
    created_at desc
  );

create or replace function public.medatlas_create_organization_invitation(
  p_organization_id uuid,
  p_email text,
  p_role public.medatlas_member_role default 'staff',
  p_ttl interval default interval '7 days'
)
returns table (
  invitation_id uuid,
  token text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public, extensions, auth
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_email text := lower(trim(p_email));
  raw_token text;
  invitation_expiry timestamptz;
  created_invitation_id uuid;
begin
  if current_user_id is null then
    raise exception 'authentication_required';
  end if;

  if not public.medatlas_is_org_admin(p_organization_id) then
    raise exception 'not_authorized';
  end if;

  if normalized_email is null
     or char_length(normalized_email) < 3
     or char_length(normalized_email) > 320
     or normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'invalid_invitation_email';
  end if;

  if p_ttl < interval '1 hour' or p_ttl > interval '30 days' then
    raise exception 'invalid_invitation_ttl';
  end if;

  if exists (
    select 1
    from public.organization_members membership
    join auth.users account on account.id = membership.user_id
    where membership.organization_id = p_organization_id
      and membership.active = true
      and lower(account.email) = normalized_email
  ) then
    raise exception 'user_already_member';
  end if;

  if exists (
    select 1
    from public.organization_invitations invitation
    where invitation.organization_id = p_organization_id
      and invitation.email = normalized_email
      and invitation.accepted_at is null
      and invitation.revoked_at is null
      and invitation.expires_at > now()
  ) then
    raise exception 'invitation_already_pending';
  end if;

  update public.organization_invitations
  set revoked_at = now()
  where organization_id = p_organization_id
    and email = normalized_email
    and accepted_at is null
    and revoked_at is null
    and expires_at <= now();

  raw_token := encode(gen_random_bytes(32), 'hex');
  invitation_expiry := now() + p_ttl;

  insert into public.organization_invitations (
    organization_id,
    email,
    role,
    token_hash,
    invited_by,
    expires_at
  )
  values (
    p_organization_id,
    normalized_email,
    p_role,
    digest(raw_token, 'sha256'),
    current_user_id,
    invitation_expiry
  )
  returning id into created_invitation_id;

  insert into public.audit_events (
    organization_id,
    actor_user_id,
    event_type,
    subject_type,
    subject_id,
    metadata
  )
  values (
    p_organization_id,
    current_user_id,
    'organization.invitation_created',
    'organization_invitation',
    created_invitation_id,
    jsonb_build_object(
      'role', p_role,
      'expires_at', invitation_expiry
    )
  );

  return query
  select created_invitation_id, raw_token, invitation_expiry;
end
$$;

create or replace function public.medatlas_accept_organization_invitation(
  p_token text
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions, auth
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  invitation public.organization_invitations%rowtype;
  existing_member_active boolean;
begin
  if current_user_id is null then
    raise exception 'authentication_required';
  end if;

  if p_token is null
     or p_token !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid_invitation_token';
  end if;

  select *
  into invitation
  from public.organization_invitations candidate
  where candidate.token_hash = digest(p_token, 'sha256')
    and candidate.accepted_at is null
    and candidate.revoked_at is null
    and candidate.expires_at > now()
  for update;

  if not found then
    raise exception 'invitation_not_available';
  end if;

  if current_email = '' or current_email <> invitation.email then
    raise exception 'invitation_email_mismatch';
  end if;

  select membership.active
  into existing_member_active
  from public.organization_members membership
  where membership.organization_id = invitation.organization_id
    and membership.user_id = current_user_id
  for update;

  if found then
    if existing_member_active then
      raise exception 'user_already_member';
    end if;

    update public.organization_members
    set
      role = invitation.role,
      active = true
    where organization_id = invitation.organization_id
      and user_id = current_user_id;
  else
    insert into public.organization_members (
      organization_id,
      user_id,
      role,
      active
    )
    values (
      invitation.organization_id,
      current_user_id,
      invitation.role,
      true
    );
  end if;

  update public.organization_invitations
  set accepted_at = now()
  where id = invitation.id;

  insert into public.audit_events (
    organization_id,
    actor_user_id,
    event_type,
    subject_type,
    subject_id,
    metadata
  )
  values (
    invitation.organization_id,
    current_user_id,
    'organization.invitation_accepted',
    'organization_invitation',
    invitation.id,
    jsonb_build_object('role', invitation.role)
  );

  return invitation.organization_id;
end
$$;

create or replace function public.medatlas_revoke_organization_invitation(
  p_invitation_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  invitation public.organization_invitations%rowtype;
begin
  if auth.uid() is null then
    raise exception 'authentication_required';
  end if;

  select *
  into invitation
  from public.organization_invitations candidate
  where candidate.id = p_invitation_id
  for update;

  if not found then
    raise exception 'invitation_not_found';
  end if;

  if not public.medatlas_is_org_admin(invitation.organization_id) then
    raise exception 'not_authorized';
  end if;

  if invitation.accepted_at is not null then
    raise exception 'invitation_already_accepted';
  end if;

  if invitation.revoked_at is not null then
    return;
  end if;

  update public.organization_invitations
  set revoked_at = now()
  where id = invitation.id;

  insert into public.audit_events (
    organization_id,
    actor_user_id,
    event_type,
    subject_type,
    subject_id
  )
  values (
    invitation.organization_id,
    auth.uid(),
    'organization.invitation_revoked',
    'organization_invitation',
    invitation.id
  );
end
$$;

revoke all on function public.medatlas_create_organization_invitation(
  uuid,
  text,
  public.medatlas_member_role,
  interval
) from public;
revoke all on function public.medatlas_accept_organization_invitation(text) from public;
revoke all on function public.medatlas_revoke_organization_invitation(uuid) from public;

grant execute on function public.medatlas_create_organization_invitation(
  uuid,
  text,
  public.medatlas_member_role,
  interval
) to authenticated;
grant execute on function public.medatlas_accept_organization_invitation(text)
  to authenticated;
grant execute on function public.medatlas_revoke_organization_invitation(uuid)
  to authenticated;

alter table public.organization_invitations enable row level security;

drop policy if exists organization_invitations_admin_select
  on public.organization_invitations;
create policy organization_invitations_admin_select
on public.organization_invitations
for select
to authenticated
using (public.medatlas_is_org_admin(organization_id));

revoke all on table public.organization_invitations from anon, authenticated;
grant select on table public.organization_invitations to authenticated;

commit;
