# Human Atlas provenance

MedAtlas pins its first anatomy integration to:

- repository: `ashemag/human-atlas`
- upstream commit: `1c38bf35c254a891200d3cedecfd57abebe83d8d`
- upstream application license: MIT
- anatomy source: BodyParts3D 4.0
- anatomy data license: CC BY 4.0

## Current integration

The first P0 integration does not yet vendor the complete ~33 MB compressed atlas into this repository.

For development and preview it reads the pinned upstream `atlas.json` and geometry chunks through a same-origin proxy at `/atlas-assets/*`. This avoids silently following mutable `main`.

The binary decoder and BodyParts3D chunk contract are adapted from Human Atlas.

## Demo mapping

The synthetic report currently maps:

- MedAtlas label: `Disco intervertebral L4–L5`
- FMA concept: `FMA16036`
- upstream concept name: `intervertebral disk of fourth lumbar vertebra`
- BodyParts3D element: `FJ3216`
- upstream chunk: `body-12.bin(.gz)`

Before production launch, atlas assets should move to a MedAtlas-controlled immutable object store/CDN with the same provenance and attribution.
