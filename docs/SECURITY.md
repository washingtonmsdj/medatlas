# MedAtlas security model

## Current scope

The repository still uses synthetic demo data only. The SQL contract in
`supabase/migrations/` defines the security boundary required before any
real patient information may be introduced.

## Tenant isolation

Every clinical record belongs to an `organization_id`.

Membership is derived from the authenticated Supabase user and the
`organization_members` table. Row Level Security is enabled on every
application table. The browser cannot bypass organization membership by
changing IDs in a request.

Read access is available to active organization members. Clinical writes are
limited to `admin` and `clinician` roles.

## Patient links

Patient links must never contain:

- patient IDs;
- report IDs;
- sequential identifiers;
- email addresses;
- raw database keys.

`medatlas_create_report_share` creates 32 random bytes and returns the raw
token once. The database stores only `SHA-256(token)`.

A token is valid only while:

1. it has not expired;
2. it has not been revoked;
3. the report is still published;
4. the report version still matches the version captured at share creation;
5. the report still has a completed clinician review.

Changing a report version therefore invalidates stale links by contract.

## Patient-safe resolver

Anonymous users never receive table access.

The only anonymous database capability planned for the patient flow is the
`medatlas_resolve_report_share(token)` RPC. It returns a deliberately small
patient-facing projection and logs successful views.

It does **not** return patient database records, organization membership,
internal document paths, raw share hashes, or audit data.

## Clinical documents

The `clinical-documents` Storage bucket is private.

Object paths start with the organization UUID. Storage RLS validates that
prefix against authenticated organization membership. Write/delete operations
require a clinical writer role.

The companion `clinical_documents` record stores a SHA-256 digest and byte
size to support provenance/integrity checks.

## Audit

The browser cannot insert arbitrary audit rows directly. Security-definer
operations such as organization creation, share creation and successful share
resolution create their own audit events.

The audit table is readable only by organization members.

## Production blockers

Do not put real patient data into MedAtlas until all of these are proved in a
dedicated Supabase project:

- migrations apply cleanly;
- auth flow is connected;
- RLS tests prove cross-tenant denial;
- private Storage tests prove cross-tenant denial;
- token creation/expiry/revocation tests pass;
- audit events are verified;
- backup/retention policy is defined;
- deployment secrets and environments are separated.
