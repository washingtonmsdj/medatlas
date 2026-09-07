# MedAtlas — arquitetura alvo

## Product boundary

MedAtlas is a communication layer between clinician and patient. It may assist with extraction, anatomical matching and educational explanations, but the clinician remains the publishing authority.

## Core domains

- **Organizations** — clinic/hospital tenant and branding.
- **Professionals** — authenticated clinicians with roles.
- **Patients** — minimal patient record scoped to organization.
- **Consultations** — encounter/context for a report.
- **Documents** — uploaded report/exam metadata and secure storage pointer.
- **Findings** — source excerpt + proposed anatomical mapping + clinician confirmation.
- **Atlas state** — structure IDs, systems, camera, visibility and annotations.
- **Visual reports** — clinician-approved patient-facing content.
- **Shares** — opaque, revocable, expiring links with audit events.
- **AI generations** — structured draft outputs, provenance, prompt/model version and human approval state.

## Security invariants

1. No report becomes patient-visible without clinician approval.
2. Share URLs use random opaque tokens; never patient IDs or sequential report IDs.
3. Tenant isolation is enforced server-side and in database policies.
4. Uploaded clinical documents are private by default.
5. Service credentials never reach the browser.
6. Audit events record publication, revocation and relevant sensitive reads.
7. AI output is stored as a draft distinct from clinician-approved content.
8. Demo fixtures never share the same storage/project as real patient data.

## 3D integration

The Human Atlas renderer should be integrated as an internal module, not an iframe in production. Preserve upstream notices and BodyParts3D attribution.

```ts
interface AtlasSelection {
  conceptId: string
  elementIds: string[]
  camera?: { view: string; zoom: number }
  visibleSystems: string[]
  annotations: Array<{ elementId: string; label: string }>
}
```

The report stores semantic atlas state, not screenshots only. This allows the patient view to reopen the same interactive structure.

## AI contract

AI extraction must return structured candidates, not free-form clinical decisions:

```json
{
  "source_excerpt": "...",
  "candidate_structures": [
    {"concept_id": "...", "label": "...", "confidence": 0.0}
  ],
  "patient_explanation_draft": "...",
  "requires_clinician_review": true
}
```

The application verifies concept IDs against the atlas catalogue before rendering them.
