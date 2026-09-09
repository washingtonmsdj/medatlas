# MedAtlas — MVP release readiness

Checkpoint: **2026-09-09**
Canonical branch: `main`
Current main HEAD: `8b00ad5fe54eaa4376cd021a4be57a533bdc8589`
Current product/frontend source HEAD: `4d860d57620ddb698fe605c3f45ff9f141fa11fd`

## Current verdict

The browser-only MedAtlas MVP is **published and externally verified with synthetic data**.

Public preview:

`https://washingtonmsdj.github.io/medatlas/`

The current product source is `4d860d57…`. The following commit `8b00ad5f…` adds a browser regression gate for the anatomy depth control hit areas and does not change product/runtime code.

The project is **not ready for real patient data** and is **not yet a production clinical system**. Supabase, authentication, real tenant-isolation proofs, private clinical Storage and a controlled clinical pilot remain deliberately blocked.

## Canonical product shell

The dark clinical shell introduced on 2026-09-09 is now the baseline and must not regress to the previous launcher/switcher design.

- `ClinicalSidebar` is the canonical navigation surface.
- The topbar contains global search, pending-action center and professional profile actions.
- `OrganizationSwitcher` is removed from the product shell.
- `ViewModeSwitcher` / the global Profissional–Paciente toggle is removed.
- Patient preview opens from the professional profile and returns through one explicit **Voltar ao profissional** action.
- Workspace/organization context is read-only in the current MVP shell; do not reintroduce a fake local switcher.
- **Novo relatório** is an action resolved through the workflow/search surface, not a permanent duplicate sidebar launcher.
- `concept-shell.css` + `concept-modules.css` are the canonical concept theme layer; the concept stylesheet no longer depends on blanket `!important` overrides.

## Canonical 3D architecture

The product has **one canonical Human Atlas engine** for BodyParts3D/FMA authority:

- full Atlas 3D explorer — approximately 2,234 parts, systems/layers, GPU visibility/selection state, picking, isolate, explode, camera views and rotation;
- focused clinical mode — the same engine fed by semantic atlas slicing and only the chunks required for the confirmed concept/context;
- patient mode — the same focused engine with simplified, patient-safe controls/language;
- optional detailed-organ viewer is a supplementary depth after a confirmed Human Atlas/FMA concept and never changes clinical authority;
- temporary inspected-part highlighting remains separate from clinically confirmed anatomy.

No static image, fake orbit, thumbnail or second simplified renderer may substitute for real geometry on a 3D-first surface.

Human Atlas upstream remains pinned to:

`1c38bf35c254a891200d3cedecfd57abebe83d8d`

BodyParts3D assets remain vendored, attributed and SHA-256 verified.

## Verified gates

### Current main (`8b00ad5f…`)

- CI run `34360983823` — **PASS**;
- database/anatomy/demo/vendored-assets/performance/security/AI/review/report/license/reference-atlas/MVP-UI contracts — **PASS**;
- TypeScript check — **PASS**;
- production build — **PASS**;
- bundle budget — **PASS**;
- Browser E2E run `34360983826` — **running at this checkpoint**; do not record it as PASS until GitHub completes it.

### Current product source (`4d860d57…`)

- CI run `34360419117` — **PASS**;
- GitHub Pages Preview run `34360419167` — **PASS** against the published site after the anatomy depth hit-area correction;
- public Pages URL — `https://washingtonmsdj.github.io/medatlas/`.

The `8b00ad5f…` commit adds `tests/e2e/anatomy-depth-layout.spec.ts`, which permanently checks at 1600×1000 and 1440×960 that the **Corpo** and **Órgão em detalhe** controls remain inside their container and their clickable areas do not overlap.

## Frontend / bundle state

Current build from CI `34360983823`:

- CSS: **188.91 kB** minified / **35.48 kB gzip**;
- initial JS entry: **319,131 bytes** / approximately **92.82 kB gzip**;
- lazy Human Atlas explorer chunk: **19.43 kB** / **7.82 kB gzip**;
- detailed-organ chunk: **48.18 kB** / **14.86 kB gzip**;
- BufferGeometryUtils chunk: **519.81 kB** / **131.13 kB gzip**;
- total JavaScript: **906,558 bytes** across 4 chunks;
- bundle budget: **PASS**.

The heavy 3D runtime remains outside the initial JavaScript entry.

Runtime range remains constrained to:

`>=22.13.0 <23`

## Preview/deployment state

### GitHub Pages — canonical synthetic preview

GitHub Pages remains the canonical public MVP preview because its workflow builds from `main`, publishes the vendored anatomy assets, checks shell/assets and provenance, and executes Chromium against the deployed 3D flow.

Latest verified product-source run: `34360419167` — **PASS**.

### Vercel — secondary path

Vercel is not an architectural dependency for the current MVP validation. Do not alter the product or anatomy architecture to work around hosting quota or platform-specific limits.

## Security / data boundary

The public preview is **synthetic-only**.

Do not introduce real patient information until the production blockers are implemented and proved:

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

Without Supabase authorization:

1. finish and keep the current Browser E2E gate green, including the anatomy-depth hit-area regression test;
2. execute the documented **manual synthetic pilot** on the public preview when a real human-navigation pass is available;
3. record only concrete UX/navigation problems observed in that pilot;
4. correct those problems without reopening solved architecture;
5. keep remote AI, billing, auth and real clinical data blocked.

When production/Supabase is explicitly authorized:

1. create a dedicated MedAtlas Supabase project;
2. apply canonical migrations;
3. prove cross-tenant/RLS boundaries before auth UI;
4. implement `SupabaseClinicalRepository`;
5. activate auth/invitations only after those tests;
6. continue prohibiting real data until security/compliance is validated.

## Do not repeat

Unless source changes invalidate the proof, do not redo or reintroduce:

- a second/simplified 3D renderer;
- `OrganizationSwitcher` in the canonical shell;
- `ViewModeSwitcher` or a global Profissional/Paciente switch;
- duplicate **Novo relatório** launcher in the sidebar;
- old Clinical Report Studio layout/breakpoint architecture;
- Human Atlas / BodyParts3D licensing and provenance investigation;
- L4-L5 Unicode dash/root-cause investigation;
- vendored asset migration;
- deterministic FMA scenario mapping;
- blank-report fail-closed workflow;
- demo-share expiry investigation;
- accessibility contrast fixes already covered by axe;
- Vercel quota workarounds as product architecture.
