# URGENTE — MedAtlas MVP

## Goal

Ship a safe, visually compelling MVP where a clinician can turn a report/exam note into a reviewed interactive anatomy explanation and share it privately with a patient.

## P0 — Foundation

- [x] Define winning product wedge: clinician-to-patient visual report.
- [x] Create canonical GitHub repository.
- [x] Create frontend shell and product flow.
- [x] Establish clinical-review safety boundary.
- [x] Record Human Atlas and BodyParts3D license obligations.
- [x] Surface BodyParts3D CC BY 4.0 + Human Atlas MIT attribution in clinician and patient UI.
- [x] Add CI gate preventing required anatomy attribution from disappearing.
- [x] Pin Human Atlas upstream commit and provenance.
- [x] Resolve demo L4–L5 structure to real FMA concept `FMA16036`.
- [x] Load real BodyParts3D geometry for the confirmed report structure.
- [x] Generalize renderer to compound concepts and multiple structures.
- [x] Port the full Human Atlas reference explorer into the Atlas 3D module: merged system geometry, GPU visibility/selection state, per-piece picking, full-system controls, views, rotation, isolate and explode.
- [x] Unify clinical and patient focused 3D with the same Human Atlas reference engine, using semantic atlas slicing + chunk remapping so focused views keep the small payload.
- [x] Avoid duplicate downloads when many concept parts share one atlas chunk.
- [x] Add anatomical search with Portuguese aliases + FMA/source-name lookup.
- [x] Separate preview from explicit clinician confirmation.
- [x] Add progressive Isolado / Sistema / Região context modes.
- [x] Cache immutable anatomy chunks in-memory across context changes.
- [x] Restore GitHub Actions by temporarily using the public repository.
- [x] Add editable patient explanation with explicit re-review gate after changes.
- [x] Add a real patient-facing demo route using the same confirmed 3D concept.
- [x] Add a true blank “Novo relatório visual” flow with no inherited anatomy/explanation.
- [x] Add local-only synthetic .txt/.md report import with a 64 KB limit.
- [x] Replace the Exames placeholder with a functional local-ingestion hub; keep PDF/image explicitly blocked.
- [x] Replace Pacientes placeholder with a synthetic current-report workspace.
- [x] Replace Consultas placeholder with a synthetic visual-session timeline.
- [x] Remove the obsolete shared placeholder component and its dead CSS after all navigation modules became functional.
- [x] Make AtlasViewport safe and searchable with no initial concept.
- [x] Freeze reproducible Node dependency installs with a canonical lockfile + `npm ci`.
- [x] Move Vite past the high-severity Windows dev-server advisory.
- [ ] Enable repository GitHub Pages source once, then re-run the ready preview workflow.
- [x] Move compressed anatomy assets to MedAtlas-controlled immutable storage.
- [x] Generate SHA-256 manifest + upstream provenance for all vendored anatomy assets.
- [x] Add CI integrity verification for the vendored anatomy closure.
- [x] Build and verify a lightweight external-preview artifact with immutable commit provenance and no anatomy binaries.
- [ ] Deploy the verified preview artifact after Vercel API quota reset (checkpoint blocker: 100/100 free API deployments used; reset reported ~2026-09-08 03:26 Bahia).
- [ ] Validate browser interaction against a deployed preview.

## P1 — SaaS core

> **Infraestrutura deliberadamente adiada:** o Supabase será conectado depois que o MVP visual, o fluxo clínico sintético e os testes de produto estiverem mais maduros. O contrato source-first permanece preservado para evitar retrabalho.

- [x] Define canonical Supabase schema + RLS contract in source.
- [x] Define organization membership and professional roles.
- [x] Define patient, consultation, report and document persistence model.
- [x] Define private clinical document bucket and Storage RLS.
- [x] Define hashed, expiring, revocable patient share tokens.
- [x] Define immutable-style audit event model and audited share operations.
- [x] Decouple UI from demo persistence through an async ClinicalRepository.
- [x] Centralize report lifecycle in a fail-closed reducer instead of ad-hoc UI mutations.
- [x] Add executable CI tests for report workflow state transitions.
- [x] Use cryptographically random opaque tokens in demo sharing.
- [ ] **Deferred:** create a dedicated MedAtlas Supabase project.
- [ ] **Deferred:** apply migrations and prove tenant isolation with database tests.
- [ ] **Deferred:** connect authentication/onboarding UI.
- [ ] **Deferred:** implement and activate the Supabase ClinicalRepository adapter.
- [ ] **Deferred:** replace local demo share resolver with the token RPC.

## P2 — AI workflow

- [x] Add deterministic report-text → known-atlas concept suggestions as a safe baseline.
- [x] Keep text analysis advisory-only until explicit clinician confirmation.
- [x] Define strict structured-AI extraction schema and runtime validator.
- [x] Resolve any future AI output only to known renderable atlas concepts.
- [x] Keep remote AI provider explicitly disabled until a backend integration exists.
- [x] Add deterministic patient-language educational draft generator.
- [x] Track draft provenance and clinician edits in the frontend model.
- [x] Clear stale explanation when source text or confirmed anatomy changes.
- [x] Reopen anatomical confirmation whenever the source report text changes.
- [x] Add synthetic multi-specialty demo scenarios (spine, kidney, heart, shoulder).
- [x] Make Portuguese anatomy aliases + demo scenarios canonical JSON SSOTs.
- [x] Add CI contract proving each demo scenario resolves to its expected pinned FMA concept.
- [ ] Add structured AI-generated patient-language draft.
- [x] Require clinician confirmation before publish.
- [x] Add permanent CI contract proving UI, demo repository, browser flow and production SQL all preserve the review gate.
- [x] Define provider/model/promptVersion/generatedAt provenance contract.
- [ ] Activate a real provider behind a backend and preserve production generation provenance.

## P3 — Product validation

- [x] Desktop/mobile E2E flow.
- [x] Browser E2E proved the complete desktop clinician → patient flow.
- [x] Fix mobile navigation labels/accessibility discovered by Browser E2E.
- [x] Validate all synthetic scenarios end-to-end in a browser.
- [x] Add patient discussion-question section without diagnostic/treatment claims.
- [x] Add browser print / save-as-PDF patient report mode.
- [x] Accessibility pass.
- [x] Axe browser gate covers overview, clinical report workspace and patient handoff for serious/critical WCAG violations.
- [x] Performance budget for anatomy payload.
- [x] Browser E2E proved the renderer against MedAtlas-vendored anatomy assets.
- [x] Privacy/security review for the synthetic MVP; real PHI remains explicitly blocked.
- [x] Demo shares expire after 30 minutes and local retention is capped.
- [x] Add functional demo settings with local-share count and explicit clear-data control.
- [x] Add CSP/security headers and CI security-contract validation.
- [x] Browser E2E proves expired demo patient links fail closed.
- [x] Automated synthetic pilot across canonical scenarios and blank-report flow.
- [x] Add guided synthetic pilot checklist to the product.
- [x] Document synthetic pilot protocol and acceptance criteria.
- [ ] Controlled clinical pilot with external professionals after production blockers are cleared.

## Do not do yet

- Do not claim diagnosis from an uploaded exam.
- Do not infer treatment autonomously.
- Do not onboard real patient data before tenancy, authorization, private storage and audit are proven.
- Do not reuse another product's Supabase project for MedAtlas.
- Do not silently switch to a Supabase backend merely because env variables exist.
- Do not accept an AI anatomy label that cannot be resolved to the pinned atlas.
- Do not fork multiple renderer architectures; integrate one canonical Human Atlas-derived 3D module.
