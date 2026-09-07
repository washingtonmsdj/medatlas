# URGENTE — MedAtlas MVP

## Goal

Ship a safe, visually compelling MVP where a clinician can turn a report/exam note into a reviewed interactive anatomy explanation and share it privately with a patient.

## P0 — Foundation

- [x] Define winning product wedge: clinician-to-patient visual report.
- [x] Create canonical GitHub repository.
- [x] Create frontend shell and product flow.
- [x] Establish clinical-review safety boundary.
- [x] Record Human Atlas and BodyParts3D license obligations.
- [ ] Integrate Human Atlas renderer and atlas catalogue.
- [ ] Replace demo anatomy viewport with real Three.js viewer.
- [ ] Validate build + browser interaction.
- [ ] Deploy preview.

## P1 — SaaS core

- [ ] Authentication and organization tenancy.
- [ ] Professionals and roles.
- [ ] Patient/consultation/report persistence.
- [ ] Private document storage.
- [ ] Expiring/revocable patient share links.
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
