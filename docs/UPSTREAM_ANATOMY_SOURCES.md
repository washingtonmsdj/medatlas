# Upstream anatomy sources

This registry records the external anatomy repositories/datasets that MedAtlas uses, adapts, evaluates, or may use for future atlas work. It is intentionally separate from runtime provenance: a source can be registered here without being integrated into the shipped product.

## 1. Current canonical integration

### Human Atlas / BodyParts3D — male reference

- Repository: `https://github.com/ashemag/human-atlas`
- Pinned MedAtlas integration commit: `1c38bf35c254a891200d3cedecfd57abebe83d8d`
- Integrated asset path: `public/models` from that checkpoint, repackaged under `public/atlas-assets/`
- Original anatomy dataset: BodyParts3D 4.0
- Original dataset publisher: Database Center for Life Science (DBCLS)
- Anatomy license: CC BY 4.0
- Official dataset: `https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html`
- Official license: `https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html`
- MedAtlas runtime provenance: `public/atlas-assets/PROVENANCE.json`

This remains the current MedAtlas anatomical authority for report matching and FMA-linked confirmation. The upstream application is an implementation source; BodyParts3D is the underlying anatomy source.

## 2. Registered newer/evaluated Human Atlas upstream

### wiiiimm/human-atlas

- Repository: `https://github.com/wiiiimm/human-atlas`
- Branch tracked for future review: `main`
- Registry checkpoint inspected: `9c1dd3d222a54844c1a8b54870663ce63b9d53b0`
- Checkpoint date: `2026-09-10`
- Application license: MIT
- Anatomy data license: CC BY 4.0
- Male anatomy source: BodyParts3D 4.0
- Female anatomy source: Human Reference Atlas / HuBMAP, 3D Reference Organ Set for Female v1.5
- Female source DOI: `https://doi.org/10.48539/HBM352.BTSQ.586`
- Female source dataset: `https://lod.humanatlas.io/ref-organ/united-female/v1.5`
- Female original GLB: `https://cdn.humanatlas.io/digital-objects/ref-organ/united-female/v1.5/assets/3d-vh-f-united.glb`

Status: **registered for evaluation, not yet integrated**.

Important: this upstream currently contains a female viewer/reference and an experimental female reconstructed study model. The reconstructed model is explicitly described upstream as experimental and estimated, not independently validated female anatomy. MedAtlas must not silently promote it to a clinical/anatomical authority.

The latest inspected checkpoint also upgrades the upstream viewer to Three.js r185. Future evaluation must compare source geometry, concept identifiers, provenance, licensing, browser performance, and MedAtlas contracts before any migration.

## 3. Current supplementary organ-detail source

### thebuggeddev/anatomy

- Repository: `https://github.com/thebuggeddev/anatomy`
- Pinned MedAtlas integration commit: `8c0e6f321a47f895ae58ce098028b92774733ee9`
- Integrated assets: selected detailed organ GLBs under `public/organ-models/`
- Status: supplementary visualization only
- License status: no standalone upstream LICENSE/COPYING was present at the pinned public checkpoint; MedAtlas records project-specific permission separately and does not represent the repository as generally open-source licensed.

Do not replace BodyParts3D/FMA authority with these detailed organ assets. Before commercial/public production release, preserve the permission evidence and complete asset-level provenance review.

## 4. Official source datasets to monitor independently

The repositories above are not the only update points. For future provenance checks, monitor the original datasets as well:

- BodyParts3D 4.0 / DBCLS: `https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html`
- BodyParts3D license: `https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html`
- Human Reference Atlas / HuBMAP female v1.5: `https://lod.humanatlas.io/ref-organ/united-female/v1.5`
- HRA source DOI: `https://doi.org/10.48539/HBM352.BTSQ.586`

## Update-check procedure

When revisiting anatomy upstreams:

1. Record the current upstream `main`/release commit before changing anything.
2. Compare it against the pinned checkpoint above; do not update the pin merely because a newer commit exists.
3. Inspect anatomy-source versions, mesh counts, concept/FMA identifiers, source IDs, license/attribution text, and any changed adaptation pipeline.
4. Recompute asset SHA-256 values if assets are imported.
5. Re-run MedAtlas anatomy, provenance, performance, and Browser E2E gates before integration.
6. Keep the existing pinned assets until the replacement passes the full release qualification.
7. Update `THIRD_PARTY_NOTICES.md`, this registry, and `public/atlas-assets/PROVENANCE.json` together when an actual runtime source changes.

A newer upstream is therefore **information to review, not an automatic dependency update**.
