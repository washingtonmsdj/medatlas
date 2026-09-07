# Third-party notices

## Human Atlas

Upstream: https://github.com/ashemag/human-atlas

Pinned integration commit:

`1c38bf35c254a891200d3cedecfd57abebe83d8d`

The upstream application code is licensed under the MIT License.

MedAtlas preserves the upstream MIT text in:

`third_party/human-atlas/LICENSE`

The binary decoding approach and BodyParts3D packaging contract used in `src/atlas/model.ts` are adapted from Human Atlas.

## BodyParts3D

Anatomical data used by Human Atlas originates from BodyParts3D 4.0.

Attribution used by the upstream project:

> BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.

Source and license information:

- https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html
- https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html
- https://creativecommons.org/licenses/by/4.0/

Geometry/data redistribution or adaptation must preserve attribution, the license reference, and an indication of changes.

## Clinical scope

BodyParts3D is reference anatomy. MedAtlas must not represent the upstream model as patient-specific anatomy or as a diagnostic/surgical model without separate validation and appropriate regulatory review.
