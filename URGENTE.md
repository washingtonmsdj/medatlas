# URGENTE — MedAtlas MVP

## Goal

Ship a safe, visually compelling MVP where a clinician can turn a report/exam note into a reviewed interactive anatomy explanation and share it privately with a patient.

## P0 — Foundation

- [x] Define winning product wedge: clinician-to-patient visual report.
- [x] Create canonical GitHub repository.
- [x] Create frontend shell and product flow.
- [x] Establish clinical-review safety boundary.
- [x] Record Human Atlas and BodyParts3D license obligations.
- [x] Pin Human Atlas upstream commit and provenance.
- [x] Resolve demo L4–L5 structure to real FMA concept `FMA16036`.
- [x] Load real BodyParts3D geometry for the confirmed report structure.
- [x] Generalize renderer to compound concepts and multiple structures.
- [x] Avoid duplicate downloads when many concept parts share one atlas chunk.
- [x] Add anatomical search with Portuguese aliases + FMA/source-name lookup.
- [x] Separate preview from explicit clinician confirmation.
- [x] Add progressive Isolado / Sistema / Região context modes.
- [x] Cache immutable anatomy chunks in-memory across context changes.
- [x] Restore GitHub Actions by temporarily using the public repository.
- [x] Add editable patient explanation with explicit re-review gate after changes.
- [x] Add a real patient-facing demo route using the same confirmed 3D concept.
- [x] Freeze reproducible Node dependency installs with a canonical lockfile + `npm ci`.
- [x] Move Vite past the high-severity Windows dev-server advisory.
- [ ] Enable repository GitHub Pages source once, then re-run the ready preview workflow.
- [ ] Move anatomy binaries to MedAtlas-controlled immutable storage.
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
- [x] Use cryptographically random opaque tokens in demo sharing.
- [ ] **Deferred:** create a dedicated MedAtlas Supabase project.
- [ ] **Deferred:** apply migrations and prove tenant isolation with database tests.
- [ ] **Deferred:** connect authentication/onboarding UI.
- [ ] **Deferred:** implement and activate the Supabase ClinicalRepository adapter.
- [ ] **Deferred:** replace local demo share resolver with the token RPC.

## P2 — AI workflow

- [x] Add deterministic report-text → known-atlas concept suggestions as a safe baseline.
- [x] Keep text analysis advisory-only until explicit clinician confirmation.
- [ ] Add structured AI extraction on top of the deterministic resolver.
- [ ] Resolve AI output only to known atlas concepts.
- [x] Add deterministic patient-language educational draft generator.
- [x] Track draft provenance and clinician edits in the frontend model.
- [x] Clear stale explanation when source text or confirmed anatomy changes.
- [x] Reopen anatomical confirmation whenever the source report text changes.
- [x] Add synthetic multi-specialty demo scenarios (spine, kidney, heart, shoulder).
- [x] Make Portuguese anatomy aliases + demo scenarios canonical JSON SSOTs.
- [x] Add CI contract proving each demo scenario resolves to its expected pinned FMA concept.
- [ ] Add structured AI-generated patient-language draft.
- [ ] Require clinician confirmation before publish.
- [ ] Version prompts/model/output and preserve provenance.

## P3 — Product validation

- [ ] Desktop/mobile E2E flow.
- [ ] Validate all synthetic scenarios end-to-end in a browser.
- [x] Add patient discussion-question section without diagnostic/treatment claims.
- [x] Add browser print / save-as-PDF patient report mode.
- [ ] Accessibility pass.
- [ ] Performance budget for anatomy payload.
- [ ] Privacy/security review before real PHI.
- [ ] Pilot with synthetic data, then controlled clinical pilot.

## Do not do yet

- Do not claim diagnosis from an uploaded exam.
- Do not infer treatment autonomously.
- Do not onboard real patient data before tenancy, authorization, private storage and audit are proven.
- Do not reuse another product's Supabase project for MedAtlas.
- Do not silently switch to a Supabase backend merely because env variables exist.
- Do not accept an AI anatomy label that cannot be resolved to the pinned atlas.
- Do not fork multiple renderer architectures; integrate one canonical Human Atlas-derived 3D module.
