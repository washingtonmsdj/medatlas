# Upstream Anatomy — permission and provenance

This file records the external implementation source used for selected MedAtlas
3D interaction patterns.

## Source

- Repository: `thebuggeddev/anatomy`
- Public upstream checkpoint: `8c0e6f321a47f895ae58ce098028b92774733ee9`
- Public announcement supplied by the MedAtlas owner:
  `https://x.com/thebuggeddev/status/2083884856531177942`

## Permission recorded for this project

On 2026-09-09, the MedAtlas owner explicitly informed the development session
that the owner of `thebuggeddev/anatomy` granted permission to copy/adapt the
repository for MedAtlas.

At the pinned checkpoint above, the public repository did not contain a
standalone `LICENSE`, `LICENSE.md` or `COPYING` file. This note records the
project-specific permission communicated by the MedAtlas owner; it does not
claim a general open-source license for the upstream repository.

## Adaptations used by MedAtlas

MedAtlas selectively adapts implementation patterns without replacing its
canonical anatomy authority:

- keyboard interaction for the canonical 3D canvas;
- interaction-aware automatic rotation that pauses during manual navigation and
  while a focused structure is being inspected;
- viewport/page visibility suspension so off-screen or hidden 3D surfaces stop
  doing per-frame camera/render work until they become relevant again;
- a camera-oriented visual cross-section implemented with Three.js local
  clipping planes, including clipping-aware picking;
- an imperatively positioned DOM callout that follows the inspected anatomical
  structure without triggering a React re-render on every animation frame;
- an explicit second-depth organ viewer reached from a selected Human Atlas
  structure instead of running as a competing anatomy surface.

These mechanisms are adapted to MedAtlas' own BodyParts3D/FMA selection,
Portuguese labels, clinical/patient modes and review semantics. Cross-section
remains a visual reference tool, not a diagnostic reconstruction or a
patient-specific volumetric slice.

## Detailed organ models

The supplementary detail catalog currently covers heart, brain, lungs, liver,
kidneys, eyeball, intestine, pancreas and skin. Exact MedAtlas/FMA mappings are
used where already curated. Label matching is only a navigation aid and never
changes the report's confirmed FMA concept.

Detailed GLBs load only after the user explicitly enters organ detail. They are
currently requested from the immutable upstream checkpoint above, so they do
not increase the MedAtlas initial anatomy payload. Deployments can set
`VITE_ORGAN_DETAIL_ASSET_BASE` to a controlled MedAtlas asset origin that
contains the same model filenames.

The detailed model is supplementary visualization. Human Atlas / BodyParts3D /
FMA remains the report anatomy authority and the full-body context remains the
primary orientation surface.

## Not imported by this checkpoint

- upstream illustrations;
- upstream educational/clinical prose;
- upstream quiz content;
- upstream database/application shell.

The project-specific permission communicated by the MedAtlas owner is recorded
above. Before a public/commercial production release, the detailed GLB asset
provenance should still be audited and archived alongside the permission record
rather than inferred from the absence of a standalone upstream license file.

## Canonical MedAtlas anatomy remains unchanged

MedAtlas continues to use one `HumanAtlasExplorerScene` shared by explorer,
clinical and patient modes, with its existing Human Atlas / BodyParts3D
provenance. Permission to adapt the external repository must not be used to
create a parallel or fake anatomy renderer.
