# MedAtlas security model

## Review outcome

**Current MVP status: approved for synthetic demonstration data only. Real patient
information remains blocked.**

This review covers the browser-only MVP and its deployment posture. It does not
replace the production review required after authentication, Supabase, private
Storage, operational logging, retention and incident-response controls exist.

## Demo-mode hardening

The demo repository is intentionally marked `syntheticOnly: true`.

A published demo report:

- receives a 256-bit opaque token generated with `crypto.getRandomValues`;
- is stored only in the browser for the synthetic demo flow;
- carries an explicit `medatlas.demo-share/1` envelope;
- expires automatically after **30 minutes**;
- is removed when malformed or expired;
- is capped at **10** locally stored demo shares;
- cannot publish while anatomy or explanation review is pending.

The clinician workspace displays a permanent warning not to enter names, CPF,
phone numbers, addresses, chart/prontuário numbers or other real identifiers.

Browser storage is **not** a clinical storage system. The TTL and limit reduce
demo residue; they do not make the demo suitable for PHI.

## Runtime/network boundary

The anatomy catalog and compressed Human Atlas/BodyParts3D assets required by
the renderer are vendored under `public/atlas-assets/`.

Normal application runtime no longer fetches anatomy from
`raw.githubusercontent.com` or the upstream Human Atlas repository.

The vendored closure is pinned to the upstream commit, carries SHA-256
provenance and is verified by CI.

## Browser/deployment hardening

The static application declares a Content Security Policy suitable for the
browser demo. The Vercel configuration additionally sends:

- Content-Security-Policy;
- `X-Content-Type-Options: nosniff`;
- `Referrer-Policy: no-referrer`;
- restrictive Permissions-Policy;
- Cross-Origin-Opener-Policy;
- Cross-Origin-Resource-Policy;
- `frame-ancestors 'none'` through CSP.

GitHub Pages cannot provide the same response-header control as Vercel, so the
HTML-level CSP remains the minimum static-hosting boundary.

## Automated security contract

`npm run validate:security-contract` fails if source changes remove core MVP
invariants, including:

- synthetic-only repository mode;
- demo-share TTL / local retention cap;
- cryptographic token generation;
- fail-closed token shape;
- CSP/header baseline;
- empty example credentials;
- no external Human Atlas runtime dependency.

Browser E2E separately proves that an expired demo share fails closed.

## Tenant isolation — production contract

Every future clinical record belongs to an `organization_id`.

Membership is derived from the authenticated Supabase user and the
`organization_members` table. Row Level Security is enabled on every
application table. The browser must not bypass organization membership by
changing IDs in a request.

Read access is available to active organization members. Clinical writes are
limited to `admin` and `clinician` roles.

## Patient links — production contract

Production patient links must never contain:

- patient IDs;
- report IDs;
- sequential identifiers;
- email addresses;
- raw database keys.

`medatlas_create_report_share` is designed to create 32 random bytes and
return the raw token once. The database stores only `SHA-256(token)`.

A token is valid only while:

1. it has not expired;
2. it has not been revoked;
3. the report is still published;
4. the report version still matches the version captured at share creation;
5. anatomy and explanation review remain completed.

## Patient-safe resolver — production contract

Anonymous users must never receive direct table access.

The planned anonymous capability is
`medatlas_resolve_report_share(token)`, returning a deliberately small
patient-facing projection and logging successful views.

It does not return patient database records, organization membership, internal
document paths, raw share hashes or audit data.

## Clinical documents — production contract

The planned `clinical-documents` Storage bucket is private.

Object paths start with the organization UUID. Storage RLS validates that
prefix against authenticated organization membership. Write/delete operations
require a clinical writer role.

The companion `clinical_documents` record stores SHA-256 and byte size for
provenance/integrity.

## Audit — production contract

The browser cannot insert arbitrary audit rows directly. Security-definer
operations such as organization creation, share creation and successful share
resolution create their own audit events.

The audit table is readable only by organization members.

## Production blockers

Do **not** put real patient data into MedAtlas until all of these are proved in
a dedicated production environment:

- migrations apply cleanly;
- auth flow is connected;
- RLS tests prove cross-tenant denial;
- private Storage tests prove cross-tenant denial;
- token creation/expiry/revocation tests pass;
- audit events are verified;
- backup/retention policy is defined;
- deployment secrets and environments are separated;
- legal/privacy basis and patient-facing notices are reviewed for the intended
  jurisdiction and clinical use;
- incident response and access-review procedures are defined.

Until then the only supported dataset is synthetic/fictitious demonstration
content.
