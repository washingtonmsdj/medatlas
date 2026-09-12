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
- may record only a local synthetic `viewCount` / `lastViewedAt` when that demo link is actually resolved;
- does **not** send demo view analytics to an external telemetry service;
- expires automatically after **30 minutes**;
- is removed when malformed or expired;
- is capped at **10** locally stored demo shares;
- cannot publish while anatomy or explanation review is pending.

The clinician workspace displays a permanent warning not to enter names, CPF,
phone numbers, addresses, chart/prontuário numbers or other real identifiers.

Browser storage is **not** a clinical storage system. The TTL and limit reduce
demo residue; they do not make the demo suitable for PHI.

## Local report ingestion

The synthetic browser MVP accepts, without upload:

- `.txt` / `.md` up to **64 KiB** of valid UTF-8;
- textual `.pdf` up to **8 MiB**, **50 pages** and **64 KiB** of extracted text;
- scanned/image-only `.pdf` through a bounded local OCR fallback, up to **8 OCR pages**, **2400 px per rendered side**, **2.5 MP per page**, **16 MP total render budget** and **12 MP embedded-image budget**;
- `.png` / `.jpg` / `.jpeg` up to **6 MiB**, **4096 px per side**, **4.5 MP** and **64 KiB** of OCR text.

`ReportIntake` does not decode file bytes. Parsing, structural validation and OCR
belong to `src/ingestion/`.

PDF ingestion validates extension, declared MIME, `%PDF-` signature, byte/page/text
limits, password state and malformed input before accepting extracted text. PDF.js
and its worker are local and lazy. Text extraction is attempted first. Only when a
valid PDF has no usable text layer may the ingestion boundary lazy-load the scanned
PDF fallback.

The scanned-PDF fallback rasterizes locally through the same pinned PDF.js boundary,
applies page/scale/dimension/pixel budgets before OCR, and lazy-loads the same local
Tesseract boundary already used for PNG/JPEG. It does not upload the document and
has no remote/CDN fallback. A document above the scanned-PDF OCR page cap fails
before Tesseract is loaded. If OCR produces no acceptable source text, ingestion
fails closed and preserves the previous valid report text.

Image ingestion validates extension/MIME binding, real PNG/JPEG signature, byte
size and dimensions/pixel count **before** loading Tesseract. Tesseract.js/core and
the Portuguese model are pinned, prepared from installed dependencies and served
by the MedAtlas origin. The worker loads directly from the local OCR asset path
with `workerBlobURL: false`; CDN/default-remote and `blob:` worker fallbacks are not
part of the accepted runtime contract.

OCR is cancellable. Failure or cancellation preserves the last valid report text.
Successful extraction only fills editable source text; it does not run anatomy
analysis, confirm FMA, approve content or publish.

The same synthetic-only restriction applies to every accepted format: real patient
reports must not be used.

## Runtime/network boundary

The anatomy catalog and compressed Human Atlas/BodyParts3D assets required by
the canonical renderer are vendored under `public/atlas-assets/`.

The supplementary detailed-organ GLBs are separately vendored under
`public/organ-models/`. Their manifest pins the permitted
`thebuggeddev/anatomy` checkpoint and records source Git blobs, byte sizes and
SHA-256 digests.

OCR runtime assets are generated under `public/ocr-assets/` from pinned npm
dependencies. The generated manifest records source versions, byte sizes and
SHA-256 digests for the eight allowed OCR runtime/model files. GitHub Pages
verification downloads every published OCR asset and checks size + SHA-256 before
running the deployed OCR tests.

Normal application runtime no longer fetches anatomy from
`raw.githubusercontent.com` or either upstream repository. Detailed organ
assets are lazy-loaded from the MedAtlas deployment only after explicit user
navigation into organ detail. OCR assets are likewise loaded only after a valid
image or bounded scanned-PDF page reaches the OCR boundary.

Vendored/generated closures are pinned and verified by CI/deployment gates.

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

`npm run validate:security-contract` and `npm run validate:ocr-contract` fail if
source changes remove core MVP invariants, including:

- synthetic-only repository mode;
- demo-share TTL / local retention cap;
- cryptographic token generation;
- fail-closed token shape;
- CSP/header baseline;
- empty example credentials;
- no external Human Atlas runtime dependency;
- no external detailed-organ runtime dependency;
- vendored organ-model provenance and SHA-256 closure;
- no direct file-byte decoding in `ReportIntake`;
- PDF parser/worker staying local and lazy;
- scanned-PDF OCR staying behind bounded page/pixel/raster limits and lazy fallback;
- PNG/JPEG structural/size/pixel validation before Tesseract loading;
- pinned, lazy, same-origin OCR worker/core/Portuguese model;
- direct OCR worker loading with `workerBlobURL: false`;
- OCR cancellation remaining separate from clinical interpretation.

Browser E2E separately proves expired-share denial, fail-closed ingestion, real
Portuguese OCR, scanned-PDF page limits and absence of automatic clinical state
transitions. Pages additionally proves the published OCR assets, same-origin
runtime paths and the image-only PDF fallback against the deployed build.

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
