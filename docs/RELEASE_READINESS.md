# MedAtlas — MVP release readiness

Checkpoint: **2026-09-08**
Canonical branch: `main`
Verified product/frontend HEAD: `7db6aad14073049e7f392415364fe904e500fa9e`

## Current verdict

The browser-only MedAtlas MVP is **published and verified in an external synthetic preview**.

Public preview:

`https://washingtonmsdj.github.io/medatlas/`

The project is **not ready for real patient data** and is **not yet a production clinical system**. Supabase, authentication, real tenant-isolation proofs, private clinical Storage and the controlled clinical pilot remain deliberately blocked.

## Canonical 3D architecture

The original gap has been closed.

Earlier MedAtlas iterations reused Human Atlas / BodyParts3D data while rendering some clinical surfaces through a simplified Three.js implementation.

The current product has **one canonical Human Atlas engine**:

- full Atlas 3D explorer — approximately 2,234 parts, systems/layers, GPU visibility/selection state, picking, isolate, explode, camera views and rotation;
- focused clinical mode — the same engine fed by semantic atlas slicing and only the chunks required for the confirmed concept/context;
- patient mode — the same focused engine with simplified, patient-safe controls/language;
- temporary inspected-part highlighting remains separate from the clinically confirmed anatomy.

No static image, fake orbit, thumbnail or second renderer is allowed to substitute for the real geometry on a 3D-first surface.

Human Atlas upstream remains pinned to:

`1c38bf35c254a891200d3cedecfd57abebe83d8d`

BodyParts3D assets remain vendored, attributed and SHA-256 verified.

## Verified gates

Current verified runs:

- CI: `34197395606` — **PASS**;
- Browser E2E: `34197395517` — **PASS**;
- GitHub Pages Preview: `34197395475` — **PASS**;
- deployed Pages URL: `https://washingtonmsdj.github.io/medatlas/`;
- Pages shell/assets + atlas provenance/index: **PASS**;
- deployed Chromium 3D tests: **2/2 PASS**.

The source-equivalent previous Browser E2E run `34196529069` also passed and produced visual QA artifact:

- name: `visual-qa-34196529069`;
- artifact ID: `10044214674`;
- 19 desktop/mobile screenshots.

Representative visual QA reviewed in this checkpoint:

- `atlas-explorer-1600.png`;
- `clinical-studio-1600.png`;
- `patient-portal-real-3d.png`;
- `focused-inspection-highlight.png`.

## Frontend / bundle state

Current production build:

- CSS: approximately **173.38 kB** minified / **32.39 kB gzip**;
- initial JS entry: **335,589 bytes** / approximately **96.45 kB gzip**;
- lazy Human Atlas renderer: approximately **502.80 kB** / **128.66 kB gzip**;
- total JavaScript: **838,398 bytes**;
- bundle budget: **PASS**.

The heavy 3D renderer is no longer part of the initial JavaScript entry.

Runtime range is constrained to:

`>=22.13.0 <23`

This preserves the tested Node 22 baseline and prevents an automatic future major upgrade.

## Preview/deployment state

### GitHub Pages — canonical preview

GitHub Pages is enabled and is the canonical public synthetic preview because its workflow:

1. builds from `main`;
2. publishes the vendored atlas assets;
3. validates JS/CSS assets;
4. validates atlas provenance/index;
5. runs Chromium against the published site;
6. requires real Human Atlas canvas in the deployed 3D flow.

### Vercel — secondary preview path

The Vercel API deployment path was successfully proven after the earlier free-tier quota reset.

A direct preview deployment reached `READY`, so Vercel quota/integration is no longer an architectural blocker. GitHub Pages remains canonical for current MVP validation because it already executes deployed 3D verification automatically.

Do not change the anatomy architecture merely to accommodate a hosting quota.

## Security / data boundary

Current public preview is **synthetic-only**.

Do not introduce real patient information until all production blockers exist and are proved:

- dedicated MedAtlas Supabase project;
- authentication;
- cross-tenant RLS denial tests;
- private Storage denial tests;
- production share expiry/revocation;
- audit verification;
- retention/backup policy;
- environment/secrets separation;
- legal/privacy review for the intended jurisdiction/use;
- controlled clinical pilot protocol and incident/support process.

## Next action

Without Supabase:

1. keep CI, Browser E2E and deployed Pages 3D verification green;
2. execute the documented **manual synthetic pilot** on the public preview;
3. record only real UX/navigation problems observed by a human;
4. correct those problems without reopening solved architecture;
5. keep remote AI, billing and real clinical data blocked.

When production/Supabase is explicitly authorized:

1. create a dedicated MedAtlas Supabase project;
2. apply canonical migrations;
3. prove cross-tenant/RLS boundaries before auth UI;
4. implement `SupabaseClinicalRepository`;
5. activate auth/invitations only after those tests;
6. continue prohibiting real data until security/compliance is validated.

## Do not repeat

Unless source changes invalidate the proof, do not redo:

- whether MedAtlas should use the Human Atlas reference engine — **it now does**;
- Human Atlas / BodyParts3D licensing and provenance investigation;
- L4-L5 Unicode dash/root-cause investigation;
- vendored asset migration;
- 34 MB anatomy/runtime architecture investigation;
- deterministic FMA scenario mapping;
- blank-report fail-closed workflow;
- demo-share expiry investigation;
- accessibility contrast fixes already covered by axe;
- report state-machine extraction;
- Vercel quota workaround investigation;
- creation of a second/simplified 3D renderer.
