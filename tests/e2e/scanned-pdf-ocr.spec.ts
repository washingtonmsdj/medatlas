import { expect, test, type Page } from '@playwright/test'

async function openBlankReport(page: Page) {
  await page.goto('/')

  const search = page.getByRole('combobox', {
    name: 'Buscar paciente, relatório, anatomia ou módulo',
  })
  await search.fill('Novo relatório')
  await page
    .getByRole('listbox', { name: 'Resultados da busca global' })
    .getByRole('option', { name: /Novo relatório/ })
    .click()

  await expect(
    page.getByRole('heading', { name: 'Adicionar laudo' }),
  ).toBeVisible()
}

async function createSyntheticOcrJpeg(page: Page) {
  const base64 = await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1000
    canvas.height = 260
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas 2D unavailable')

    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.fillStyle = '#000000'
    context.font = '700 72px Arial, sans-serif'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText('LAUDO SINTETICO CORACAO', 500, 130)

    return canvas.toDataURL('image/jpeg', 0.95).split(',')[1]
  })

  return Buffer.from(base64, 'base64')
}

function createImageOnlyPdf(jpeg: Buffer, pageCount = 1) {
  const imageWidth = 1000
  const imageHeight = 260
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
        `<< /Type /XObject /Subtype /Image /Width ${imageWidth} /Height ${imageHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`,
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

test('extracts an image-only PDF through bounded local OCR without auto-running anatomy', async ({
  page,
}) => {
  test.setTimeout(120_000)
  await openBlankReport(page)

  const origin = new URL(page.url()).origin
  const ocrRequests: string[] = []
  const remoteOcrRequests: string[] = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.pathname.includes('/ocr-assets/')) ocrRequests.push(request.url())
    if (
      url.origin !== origin &&
      /tesseract|traineddata|jsdelivr|unpkg|projectnaptha/i.test(request.url())
    ) {
      remoteOcrRequests.push(request.url())
    }
  })

  const pdf = createImageOnlyPdf(await createSyntheticOcrJpeg(page))
  await page
    .getByLabel('Importar laudo sintético em TXT, MD, PDF, PNG ou JPG')
    .setInputFiles({
      name: 'laudo-escaneado.pdf',
      mimeType: 'application/pdf',
      buffer: pdf,
    })

  const editor = page.getByRole('textbox', {
    name: 'Texto do laudo ou relatório',
  })
  await expect(editor).toHaveValue(/SINTETICO\s+CORAC/i, {
    timeout: 60_000,
  })
  await expect(page.getByText('laudo-escaneado.pdf')).toBeVisible()
  await expect(page.getByText(/1 página .* OCR local \(1 página\)/)).toBeVisible()
  await expect(page.getByText('ESTRUTURAS ENCONTRADAS')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Encontrar anatomia' })).toBeEnabled()

  const parsedOcrRequests = ocrRequests.map((value) => new URL(value))
  expect(parsedOcrRequests.some((url) => url.pathname.endsWith('/ocr-assets/worker.min.js'))).toBe(true)
  expect(parsedOcrRequests.some((url) => url.pathname.endsWith('/ocr-assets/lang/por.traineddata.gz'))).toBe(true)
  expect(parsedOcrRequests.every((url) => url.origin === origin)).toBe(true)
  expect(remoteOcrRequests).toEqual([])
})

test('rejects image-only PDFs above the OCR page cap before loading Tesseract', async ({
  page,
}) => {
  await openBlankReport(page)

  const editor = page.getByRole('textbox', {
    name: 'Texto do laudo ou relatório',
  })
  await editor.fill('Texto sintético preservado.')

  const ocrRequests: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('/ocr-assets/')) ocrRequests.push(request.url())
  })

  const pdf = createImageOnlyPdf(await createSyntheticOcrJpeg(page), 9)
  await page
    .getByLabel('Importar laudo sintético em TXT, MD, PDF, PNG ou JPG')
    .setInputFiles({
      name: 'laudo-escaneado-9-paginas.pdf',
      mimeType: 'application/pdf',
      buffer: pdf,
    })

  await expect(page.getByRole('alert')).toHaveText(
    'PDF escaneado acima do limite de 8 páginas para OCR local.',
  )
  await expect(editor).toHaveValue('Texto sintético preservado.')
  expect(ocrRequests).toEqual([])
})
