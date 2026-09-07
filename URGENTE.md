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
- [ ] Enable repository GitHub Pages source once, then re-run the ready preview workflow.
- [ ] Move anatomy binaries to MedAtlas-controlled immutable storage.
- [ ] Validate browser interaction against a deployed preview.

## P1 — SaaS core

- [x] Define canonical Supabase schema + RLS contract in source.
- [x] Define organization membership and professional roles.
- [x] Define patient, consultation, report and document persistence model.
- [x] Define private clinical document bucket and Storage RLS.
- [x] Define hashed, expiring, revocable patient share tokens.
- [x] Define immutable-style audit event model and audited share operations.
- [x] Decouple UI from demo persistence through an async ClinicalRepository.
- [x] Use cryptographically random opaque tokens in demo sharing.
- [ ] Create a dedicated MedAtlas Supabase project.
- [ ] Apply migrations and prove tenant isolation with database tests.
- [ ] Connect authentication/onboarding UI.
- [ ] Implement and activate the Supabase ClinicalRepository adapter.
- [ ] Replace local demo share resolver with the token RPC.

## P2 — AI workflow

- [ ] Extract anatomical terms from clinician-provided text/document.
- [ ] Resolve only to known atlas concepts.
- [ ] Generate patient-language draft.
- [ ] Require clinician confirmation before publish.
- [ ] Version prompts/model/output and preserve provenance.

## P3 — Product validation

- [ ] Desktop/mobile E2E flow.
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
- Do not fork multiple renderer architectures; integrate one canonical Human Atlas-derived 3D module.
