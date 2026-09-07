begin;

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
  membership_upserted boolean := false;
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
  )
  on conflict (organization_id, user_id)
  do update
  set
    role = excluded.role,
    active = true
  where public.organization_members.active = false
  returning true into membership_upserted;

  if not coalesce(membership_upserted, false) then
    raise exception 'user_already_member';
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

commit;
