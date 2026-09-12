import type { Page } from '@playwright/test'

const OCR_FIXTURE_WIDTH = 1000
const OCR_FIXTURE_HEIGHT = 260
const OCR_FIXTURE_TEXT = 'LAUDO SINTETICO CORACAO'

async function createSyntheticOcrImage(
  page: Page,
  mimeType: 'image/png' | 'image/jpeg',
) {
  const base64 = await page.evaluate(
    ({ width, height, text, type }) => {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Canvas 2D unavailable')

      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.fillStyle = '#000000'
      context.font = '700 72px Arial, sans-serif'
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillText(text, width / 2, height / 2)

      return canvas.toDataURL(type, 0.95).split(',')[1]
    },
    {
      width: OCR_FIXTURE_WIDTH,
      height: OCR_FIXTURE_HEIGHT,
      text: OCR_FIXTURE_TEXT,
      type: mimeType,
    },
  )

  return Buffer.from(base64, 'base64')
}

export function createSyntheticOcrPng(page: Page) {
  return createSyntheticOcrImage(page, 'image/png')
}

export function createSyntheticOcrJpeg(page: Page) {
  return createSyntheticOcrImage(page, 'image/jpeg')
}

export function createImageOnlyPdf(jpeg: Buffer, pageCount = 1) {
  const firstPageId = 3
  const imageId = firstPageId + pageCount
  const contentId = imageId + 1
  const maxObjectId = contentId
  const pageIds = Array.from(
    { length: pageCount },
    (_, index) => firstPageId + index,
  )
  const content = Buffer.from('q 540 0 0 140 36 326 cm /Im0 Do Q', 'ascii')

  const objectBodies = new Map<number, Buffer>()
  objectBodies.set(
    1,
    Buffer.from('<< /Type /Catalog /Pages 2 0 R >>', 'ascii'),
  )
  objectBodies.set(
    2,
    Buffer.from(
      `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageCount} >>`,
      'ascii',
    ),
  )

  for (const pageId of pageIds) {
    objectBodies.set(
      pageId,
      Buffer.from(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /XObject << /Im0 ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`,
        'ascii',
      ),
    )
  }

  objectBodies.set(
    imageId,
    Buffer.concat([
      Buffer.from(
        `<< /Type /XObject /Subtype /Image /Width ${OCR_FIXTURE_WIDTH} /Height ${OCR_FIXTURE_HEIGHT} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`,
        'ascii',
      ),
      jpeg,
      Buffer.from('\nendstream', 'ascii'),
    ]),
  )
  objectBodies.set(
    contentId,
    Buffer.concat([
      Buffer.from(`<< /Length ${content.length} >>\nstream\n`, 'ascii'),
      content,
      Buffer.from('\nendstream', 'ascii'),
    ]),
  )

  const parts: Buffer[] = [Buffer.from('%PDF-1.4\n', 'ascii')]
  const offsets = new Array<number>(maxObjectId + 1).fill(0)
  let cursor = parts[0].length

  for (let id = 1; id <= maxObjectId; id += 1) {
    const body = objectBodies.get(id)
    if (!body) throw new Error(`Missing PDF object ${id}`)

    offsets[id] = cursor
    const object = Buffer.concat([
      Buffer.from(`${id} 0 obj\n`, 'ascii'),
      body,
      Buffer.from('\nendobj\n', 'ascii'),
    ])
    parts.push(object)
    cursor += object.length
  }

  const xrefOffset = cursor
  let xref = `xref\n0 ${maxObjectId + 1}\n0000000000 65535 f \n`
  for (let id = 1; id <= maxObjectId; id += 1) {
    xref += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`
  }
  xref += `trailer\n<< /Size ${maxObjectId + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`
  parts.push(Buffer.from(xref, 'ascii'))

  return Buffer.concat(parts)
}
