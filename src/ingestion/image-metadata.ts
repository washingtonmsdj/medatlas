export type LocalImageKind = 'png' | 'jpeg'

export type LocalImageMetadataResult =
  | {
      ok: true
      kind: LocalImageKind
      width: number
      height: number
    }
  | {
      ok: false
      reason: 'invalid-signature' | 'invalid-dimensions'
    }

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const PNG_IHDR = [0x49, 0x48, 0x44, 0x52]
const JPEG_START_OF_FRAME_MARKERS = new Set([
  0xc0,
  0xc1,
  0xc2,
  0xc3,
  0xc5,
  0xc6,
  0xc7,
  0xc9,
  0xca,
  0xcb,
  0xcd,
  0xce,
  0xcf,
])

function matchesBytes(
  bytes: Uint8Array,
  offset: number,
  expected: readonly number[],
) {
  if (offset + expected.length > bytes.length) return false
  return expected.every((value, index) => bytes[offset + index] === value)
}

function readUint32BigEndian(bytes: Uint8Array, offset: number) {
  return (
    bytes[offset] * 0x1000000 +
    bytes[offset + 1] * 0x10000 +
    bytes[offset + 2] * 0x100 +
    bytes[offset + 3]
  )
}

function parsePngMetadata(bytes: Uint8Array): LocalImageMetadataResult {
  if (!matchesBytes(bytes, 0, PNG_SIGNATURE)) {
    return { ok: false, reason: 'invalid-signature' }
  }

  if (
    bytes.length < 24 ||
    readUint32BigEndian(bytes, 8) !== 13 ||
    !matchesBytes(bytes, 12, PNG_IHDR)
  ) {
    return { ok: false, reason: 'invalid-dimensions' }
  }

  const width = readUint32BigEndian(bytes, 16)
  const height = readUint32BigEndian(bytes, 20)

  if (width <= 0 || height <= 0) {
    return { ok: false, reason: 'invalid-dimensions' }
  }

  return { ok: true, kind: 'png', width, height }
}

function isStandaloneJpegMarker(marker: number) {
  return marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)
}

function parseJpegMetadata(bytes: Uint8Array): LocalImageMetadataResult {
  if (
    bytes.length < 4 ||
    bytes[0] !== 0xff ||
    bytes[1] !== 0xd8 ||
    bytes[2] !== 0xff
  ) {
    return { ok: false, reason: 'invalid-signature' }
  }

  let offset = 2

  while (offset < bytes.length) {
    while (offset < bytes.length && bytes[offset] !== 0xff) offset += 1
    while (offset < bytes.length && bytes[offset] === 0xff) offset += 1

    if (offset >= bytes.length) break

    const marker = bytes[offset]
    offset += 1

    if (marker === 0x00) continue
    if (marker === 0xda || marker === 0xd9) break
    if (isStandaloneJpegMarker(marker)) continue

    if (offset + 2 > bytes.length) {
      return { ok: false, reason: 'invalid-dimensions' }
    }

    const segmentLength = bytes[offset] * 0x100 + bytes[offset + 1]
    if (segmentLength < 2 || offset + segmentLength > bytes.length) {
      return { ok: false, reason: 'invalid-dimensions' }
    }

    if (JPEG_START_OF_FRAME_MARKERS.has(marker)) {
      if (segmentLength < 7) {
        return { ok: false, reason: 'invalid-dimensions' }
      }

      const height = bytes[offset + 3] * 0x100 + bytes[offset + 4]
      const width = bytes[offset + 5] * 0x100 + bytes[offset + 6]

      if (width <= 0 || height <= 0) {
        return { ok: false, reason: 'invalid-dimensions' }
      }

      return { ok: true, kind: 'jpeg', width, height }
    }

    offset += segmentLength
  }

  return { ok: false, reason: 'invalid-dimensions' }
}

export function localImageKindFromFilename(
  filename: string,
): LocalImageKind | null {
  const normalized = filename.toLowerCase()
  if (normalized.endsWith('.png')) return 'png'
  if (normalized.endsWith('.jpg') || normalized.endsWith('.jpeg')) return 'jpeg'
  return null
}

export function localImageMimeMatchesKind(
  mimeType: string,
  kind: LocalImageKind,
) {
  const normalized = mimeType.trim().toLowerCase()
  if (!normalized) return true
  return kind === 'png'
    ? normalized === 'image/png'
    : normalized === 'image/jpeg'
}

export function parseLocalImageMetadata(
  bytes: Uint8Array,
  expectedKind: LocalImageKind,
): LocalImageMetadataResult {
  const result =
    expectedKind === 'png'
      ? parsePngMetadata(bytes)
      : parseJpegMetadata(bytes)

  if (result.ok && result.kind !== expectedKind) {
    return { ok: false, reason: 'invalid-signature' }
  }

  return result
}
