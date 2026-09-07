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

- [ ] Authentication and organization tenancy.
- [ ] Professionals and roles.
- [ ] Patient/consultation/report persistence.
- [ ] Private document storage.
- [ ] Replace local demo share with opaque, expiring and revocable patient tokens.
- [ ] Audit trail.

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
- Do not fork multiple renderer architectures; integrate one canonical Human Atlas-derived 3D module.
