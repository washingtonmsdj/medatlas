# Organization invitations

The MedAtlas invitation flow is source-first and fail-closed. The contract exists before any production email transport or authentication-backed UI is enabled.

## Canonical lifecycle

```text
admin requests invitation
        ↓
validate organization admin authority
        ↓
normalize + validate invite email
        ↓
generate 32 random bytes
        ↓
return raw token once
        ↓
persist only SHA-256 token hash
        ↓
invitee authenticates with matching email
        ↓
resolve active, unexpired, unrevoked invitation
        ↓
create organization_members row
        ↓
mark invitation accepted
        ↓
audit event
```

## Storage

`public.organization_invitations` stores:

- `organization_id`;
- normalized lower-case email;
- canonical MedAtlas member role (`admin | clinician | staff`);
- `token_hash` only;
- inviter identity;
- expiry;
- accepted/revoked timestamps;
- creation timestamp.

The raw token is never a table column.

## Authority

Creating and revoking invitations requires `medatlas_is_org_admin(organization_id)`.

Acceptance requires an authenticated user. The authenticated email from `auth.jwt()` must exactly match the normalized invitation email. A token cannot be used to attach an arbitrary account to an organization.

## Token handling

Creation uses 32 random bytes encoded as hexadecimal. Only `digest(raw_token, 'sha256')` is persisted. The raw token is returned once by `medatlas_create_organization_invitation` so a future backend transport can place it into a one-time invitation URL.

The acceptance RPC validates the expected 64-character hexadecimal format before looking up the token hash.

## Expiration and revocation

Invitation TTL must be between one hour and 30 days. The default contract is seven days.

Expired pending invitations are revoked before a replacement can be created for the same organization/email pair. Accepted invitations cannot be revoked.

## Audit

The contract records:

- `organization.invitation_created`;
- `organization.invitation_accepted`;
- `organization.invitation_revoked`.

The audit metadata deliberately avoids persisting the raw token.

## RLS and grants

`organization_invitations` has RLS enabled. Only organization admins may select invitation rows. Direct table mutation is not granted to the browser; creation, acceptance and revocation go through the narrow RPCs.

Invitation RPCs are granted to `authenticated` only. They are not exposed to `anon`.

## Current MVP boundary

The demo frontend shows the invitation security contract but keeps **Convidar membro** disabled. It does not send email, create pending invitations, or mutate membership.

Production activation requires:

1. dedicated MedAtlas Supabase project;
2. authenticated organization context;
3. applied migrations and cross-tenant tests;
4. backend/edge transport for invitation links;
5. secure application URL handling;
6. end-to-end acceptance/revocation tests.

Do not enable a browser-only or fake invitation path as a shortcut.
