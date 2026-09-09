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
- a camera-oriented visual cross-section implemented with Three.js local
  clipping planes, including clipping-aware picking;
- an imperatively positioned DOM callout that follows the inspected anatomical
  structure without triggering a React re-render on every animation frame.

These mechanisms are adapted to MedAtlas' own BodyParts3D bounds, offsets,
Portuguese labels, clinical/patient modes and review semantics. The cross-section
is explicitly a visual reference tool, not a diagnostic reconstruction or a
patient-specific volumetric slice.

## Not imported by this checkpoint

- upstream GLB organ models;
- upstream illustrations;
- upstream educational/clinical prose;
- upstream quiz content.

Those assets/content are not needed for the current MedAtlas architecture and
may carry provenance or third-party rights separate from the repository owner's
code permission.

## Canonical MedAtlas anatomy remains unchanged

MedAtlas continues to use one `HumanAtlasExplorerScene` shared by explorer,
clinical and patient modes, with its existing Human Atlas / BodyParts3D
provenance. Permission to adapt the external repository must not be used to
create a parallel or fake anatomy renderer.
