# MedAtlas — MVP release readiness

Checkpoint: **2026-09-07**
Canonical branch: `main`
Verified product HEAD: `f275696e828df5ad1ef2c9b2ddf51ca4720eebb4`

## Current verdict

The browser-only MedAtlas MVP is **ready for an external synthetic preview**. The canonical 3D engine now derives directly from Human Atlas in both full explorer and focused clinical modes.

It is **not ready for real patient data** and is **not yet a production clinical
system**. Supabase, authentication, tenant isolation proofs, private clinical
Storage and the controlled clinical pilot remain deliberately blocked.

## Verified gates

At the checkpoint above:

- CI: PASS;
- TypeScript: PASS;
- Vite production build: PASS;
- production dependency audit: PASS at configured threshold;
- database source contract: PASS;
- anatomy/FMA contract: PASS;
- canonical demo scenarios: PASS;
- vendored anatomy SHA-256 closure: PASS;
- anatomy payload budget: PASS;
- synthetic privacy/security contract: PASS;
- structured-AI safety contract: PASS;
- clinician review gate: PASS;
- report workflow state-machine test: PASS;
- required BodyParts3D/Human Atlas attribution gate: PASS;
- Browser E2E from the preceding product commit: PASS;
- axe serious/critical accessibility gate: PASS;
- desktop/mobile clinician → patient flow: PASS.

## Lightweight preview artifact

Workflow:

`.github/workflows/preview-artifact.yml`

Successful run:

`34090950791`

Artifact:

- name: `medatlas-preview-static`;
- artifact ID: `10006796553`;
- ZIP size: **204,368 bytes**;
- extracted size: **765,407 bytes**;
- digest:
  `sha256:632090a0dc36000f48af5a7585155d92f2ddca14fd3747dfe0ad25743248d32a`;
- retention at this checkpoint: through **2026-09-10 06:28 UTC**.

Contents:

```text
index.html
assets/index-DlEwlJEB.js
assets/index-D-s9lvOo.css
vercel.json
PREVIEW-PROVENANCE.json
```

The artifact deliberately contains **no anatomy .bin/.bin.gz files**.

For this external preview artifact only, anatomy is loaded from the immutable
public GitHub URL corresponding to the same commit. The canonical application
continues to vendor and verify its own anatomy assets in
`public/atlas-assets/`.

## Preview provenance

`PREVIEW-PROVENANCE.json` identifies:

- repository: `washingtonmsdj/medatlas`;
- commit: `119de599601b29b46c9dca7376598dd36c4147b2`;
- clinical data mode: `synthetic-only`;
- anatomy asset origin pinned to that exact commit.

## Current external deployment blocker

A direct Vercel preview deployment was attempted through the connected Vercel
API after the source/asset strategy had been solved.

Vercel rejected the deployment with:

```text
payment_required
api-deployments-free-per-day
total: 100
remaining: 0
```

The latest API response reports quota reset at approximately:

**2026-09-08 03:58:37 (America/Bahia)**.

This is an account quota blocker, not a build/application failure.

## Exact next action

After the Vercel API deployment quota resets:

1. use the successful `medatlas-preview-static` artifact, or rebuild it from
   the current desired HEAD;
2. deploy its five files to the existing Vercel `medatlas` project as a
   preview;
3. verify root page HTTP/rendering;
4. verify navigation: Overview → Exams → Reports → Atlas;
5. execute one canonical synthetic scenario;
6. publish a synthetic patient share;
7. verify `/p/<token>` rewrite and patient page;
8. verify anatomy geometry loads from the pinned preview asset origin;
9. inspect CSP/security headers;
10. only then mark “Validate browser interaction against a deployed preview”
    complete.

## Production blockers that must remain closed

Do not introduce real patient information until all of these exist and are
proved:

- dedicated MedAtlas Supabase project;
- authentication;
- RLS cross-tenant denial tests;
- private Storage cross-tenant denial tests;
- production share expiry/revocation;
- audit verification;
- retention/backup policy;
- environment/secrets separation;
- legal/privacy review for the intended jurisdiction/use;
- controlled clinical pilot protocol and support/incident process.

## Do not repeat

Unless source changes invalidate them, do not redo:

- Human Atlas licensing/provenance investigation;
- L4-L5 Unicode dash root-cause investigation;
- vendored asset migration;
- 34 MB runtime dependency removal from preview artifact;
- deterministic FMA scenario mapping;
- blank-report fail-closed workflow;
- demo-share expiry investigation;
- accessibility contrast fixes already covered by axe;
- report state-machine extraction;
- Vercel “how to avoid uploading the 34 MB anatomy binaries” investigation.

The current preview blocker is quota only. The full Human Atlas explorer and the focused clinical/patient renderer are already validated on the same canonical engine.
