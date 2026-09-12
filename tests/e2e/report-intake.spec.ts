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

function createSyntheticPdf(text = 'Laudo sintetico sobre L4-L5.') {
  const escapedText = text
    .replaceAll('\\', '\\\\')
    .replaceAll('(', '\\(')
    .replaceAll(')', '\\)')
  const stream = text
    ? `BT /F1 12 Tf 72 720 Td (${escapedText}) Tj ET`
    : ''
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    `5 0 obj\n<< /Length ${Buffer.byteLength(stream, 'ascii')} >>\nstream\n${stream}\nendstream\nendobj\n`,
  ]

  let pdf = '%PDF-1.4\n'
  const offsets = [0]

  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, 'ascii'))
    pdf += object
  }

  const xrefOffset = Buffer.byteLength(pdf, 'ascii')
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += '0000000000 65535 f \n'
  for (let index = 1; index <= objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`

  return Buffer.from(pdf, 'ascii')
}


function createSyntheticPngHeader(width: number, height: number) {
  const bytes = Buffer.alloc(24)
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(bytes, 0)
  bytes.writeUInt32BE(13, 8)
  Buffer.from('IHDR', 'ascii').copy(bytes, 12)
  bytes.writeUInt32BE(width, 16)
  bytes.writeUInt32BE(height, 20)
  return bytes
}

async function createSyntheticOcrPng(page: Page) {
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

    return canvas.toDataURL('image/png').split(',')[1]
  })

  return Buffer.from(base64, 'base64')
}

test('enforces the report text byte limit before analysis', async ({ page }) => {
  await openBlankReport(page)

  const editor = page.getByRole('textbox', {
    name: 'Texto do laudo ou relatório',
  })
  const analyze = page.getByRole('button', { name: 'Encontrar anatomia' })

  await editor.fill('Laudo sintético válido.')
  await expect(analyze).toBeEnabled()

  const acceptedText = await editor.inputValue()
  await editor.fill('a'.repeat(64 * 1024 + 1))

  await expect(editor).toHaveValue(acceptedText)
  await expect(page.getByRole('alert')).toHaveText(
    'Texto acima do limite de 64 KB.',
  )
  await expect(analyze).toBeDisabled()

  await editor.fill('Novo laudo sintético válido.')
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(analyze).toBeEnabled()
})

test('describes the formats that the browser MVP actually accepts', async ({
  page,
}) => {
  await openBlankReport(page)

  await expect(
    page.getByText('Cole o texto ou importe TXT, MD, PDF, PNG ou JPG.'),
  ).toBeVisible()
  await expect(
    page.getByLabel('Importar laudo sintético em TXT, MD, PDF, PNG ou JPG'),
  ).toHaveAttribute(
    'accept',
    '.txt,.md,text/plain,text/markdown,text/x-markdown,.pdf,application/pdf,.png,.jpg,.jpeg,image/png,image/jpeg',
  )
  await expect(page.getByText('.txt · .md · .pdf · .png · .jpg · .jpeg · texto até 64 KB')).toBeVisible()
})

test('extracts a local PDF into editable text without auto-running anatomy analysis', async ({
  page,
}) => {
  await openBlankReport(page)

  await page
    .getByLabel('Importar laudo sintético em TXT, MD, PDF, PNG ou JPG')
    .setInputFiles({
      name: 'laudo.pdf',
      mimeType: 'application/pdf',
      buffer: createSyntheticPdf(),
    })

  const editor = page.getByRole('textbox', {
    name: 'Texto do laudo ou relatório',
  })
  await expect(editor).toHaveValue('Laudo sintetico sobre L4-L5.')
  await expect(page.getByText('laudo.pdf')).toBeVisible()
  await expect(page.getByText(/1 página · .* bytes extraídos/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Encontrar anatomia' })).toBeEnabled()
  await expect(page.getByText('ESTRUTURAS ENCONTRADAS')).toHaveCount(0)
})

test('rejects oversized PDF before parsing and preserves valid report text', async ({
  page,
}) => {
  await openBlankReport(page)

  const editor = page.getByRole('textbox', {
    name: 'Texto do laudo ou relatório',
  })
  await editor.fill('Texto sintético preservado.')

  const oversizedPdf = Buffer.alloc(8 * 1024 * 1024 + 1)
  oversizedPdf.write('%PDF-', 0, 'ascii')

  await page
    .getByLabel('Importar laudo sintético em TXT, MD, PDF, PNG ou JPG')
    .setInputFiles({
      name: 'grande.pdf',
      mimeType: 'application/pdf',
      buffer: oversizedPdf,
    })

  await expect(page.getByRole('alert')).toHaveText(
    'PDF acima do limite de 8 MB.',
  )
  await expect(editor).toHaveValue('Texto sintético preservado.')
})

test('rejects a TXT filename with an incompatible declared media type', async ({
  page,
}) => {
  await openBlankReport(page)

  const editor = page.getByRole('textbox', {
    name: 'Texto do laudo ou relatório',
  })
  await editor.fill('Texto sintético preservado.')

  await page
    .getByLabel('Importar laudo sintético em TXT, MD, PDF, PNG ou JPG')
    .setInputFiles({
      name: 'laudo.txt',
      mimeType: 'application/pdf',
      buffer: Buffer.from('conteúdo sintético'),
    })

  await expect(page.getByRole('alert')).toHaveText(
    'Tipo de arquivo incompatível com a extensão selecionada.',
  )
  await expect(editor).toHaveValue('Texto sintético preservado.')
})

test('rejects a PDF filename with an incompatible declared media type', async ({
  page,
}) => {
  await openBlankReport(page)

  const editor = page.getByRole('textbox', {
    name: 'Texto do laudo ou relatório',
  })
  await editor.fill('Texto sintético preservado.')

  await page
    .getByLabel('Importar laudo sintético em TXT, MD, PDF, PNG ou JPG')
    .setInputFiles({
      name: 'laudo.pdf',
      mimeType: 'text/plain',
      buffer: createSyntheticPdf(),
    })

  await expect(page.getByRole('alert')).toHaveText(
    'Tipo de arquivo incompatível com a extensão selecionada.',
  )
  await expect(editor).toHaveValue('Texto sintético preservado.')
})

test('rejects a fake PDF signature without replacing valid report text', async ({
  page,
}) => {
  await openBlankReport(page)

  const editor = page.getByRole('textbox', {
    name: 'Texto do laudo ou relatório',
  })
  await editor.fill('Texto sintético preservado.')

  await page
    .getByLabel('Importar laudo sintético em TXT, MD, PDF, PNG ou JPG')
    .setInputFiles({
      name: 'laudo.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('nao-e-pdf'),
    })

  await expect(page.getByRole('alert')).toHaveText(
    'O arquivo não possui uma assinatura PDF válida.',
  )
  await expect(editor).toHaveValue('Texto sintético preservado.')
})

test('rejects malformed PDF data fail-closed', async ({ page }) => {
  await openBlankReport(page)

  await page
    .getByLabel('Importar laudo sintético em TXT, MD, PDF, PNG ou JPG')
    .setInputFiles({
      name: 'corrompido.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4\nconteudo truncado', 'ascii'),
    })

  await expect(page.getByRole('alert')).toHaveText(/PDF inválido ou corrompido|Não foi possível processar o PDF/)
})

test('keeps scanned/no-text PDF out until PDF OCR exists', async ({ page }) => {
  await openBlankReport(page)

  await page
    .getByLabel('Importar laudo sintético em TXT, MD, PDF, PNG ou JPG')
    .setInputFiles({
      name: 'sem-texto.pdf',
      mimeType: 'application/pdf',
      buffer: createSyntheticPdf(''),
    })

  await expect(page.getByRole('alert')).toHaveText(
    'Este PDF não contém texto extraível. Imagem/OCR do PDF ainda não é suportado.',
  )
})

test('rejects invalid UTF-8 without replacing the last valid report text', async ({
  page,
}) => {
  await openBlankReport(page)

  const editor = page.getByRole('textbox', {
    name: 'Texto do laudo ou relatório',
  })
  await editor.fill('Texto sintético preservado.')

  await page
    .getByLabel('Importar laudo sintético em TXT, MD, PDF, PNG ou JPG')
    .setInputFiles({
      name: 'laudo.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from([0xc3, 0x28]),
    })

  await expect(page.getByRole('alert')).toHaveText(
    'O arquivo precisa estar em UTF-8 válido.',
  )
  await expect(editor).toHaveValue('Texto sintético preservado.')
})


test('rejects a fake PNG signature before OCR and preserves valid report text', async ({
  page,
}) => {
  await openBlankReport(page)

  const editor = page.getByRole('textbox', {
    name: 'Texto do laudo ou relatório',
  })
  await editor.fill('Texto sintético preservado.')

  await page
    .getByLabel('Importar laudo sintético em TXT, MD, PDF, PNG ou JPG')
    .setInputFiles({
      name: 'laudo.png',
      mimeType: 'image/png',
      buffer: Buffer.from('nao-e-png'),
    })

  await expect(page.getByRole('alert')).toHaveText(
    'A assinatura da imagem não corresponde ao formato selecionado.',
  )
  await expect(editor).toHaveValue('Texto sintético preservado.')
})

test('rejects oversized and excessive-pixel images before OCR', async ({ page }) => {
  await openBlankReport(page)

  const editor = page.getByRole('textbox', {
    name: 'Texto do laudo ou relatório',
  })
  await editor.fill('Texto sintético preservado.')
  const input = page.getByLabel(
    'Importar laudo sintético em TXT, MD, PDF, PNG ou JPG',
  )

  await input.setInputFiles({
    name: 'grande.png',
    mimeType: 'image/png',
    buffer: Buffer.alloc(6 * 1024 * 1024 + 1),
  })
  await expect(page.getByRole('alert')).toHaveText(
    'Imagem acima do limite de 6 MB.',
  )
  await expect(editor).toHaveValue('Texto sintético preservado.')

  await input.setInputFiles({
    name: 'dimensoes.png',
    mimeType: 'image/png',
    buffer: createSyntheticPngHeader(4097, 1200),
  })
  await expect(page.getByRole('alert')).toHaveText(/Imagem acima do limite de/)
  await expect(editor).toHaveValue('Texto sintético preservado.')
})

test('runs real Portuguese OCR from same-origin assets without auto-running anatomy', async ({
  page,
}) => {
  await openBlankReport(page)

  const origin = new URL(page.url()).origin
  const ocrRequests: string[] = []
  const remoteOcrRequests: string[] = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.pathname.includes('/ocr-assets/')) {
      ocrRequests.push(url.pathname)
    }
    if (
      url.origin !== origin &&
      /tesseract|traineddata|jsdelivr|unpkg|projectnaptha/i.test(request.url())
    ) {
      remoteOcrRequests.push(request.url())
    }
  })

  await page
    .getByLabel('Importar laudo sintético em TXT, MD, PDF, PNG ou JPG')
    .setInputFiles({
      name: 'laudo-ocr.png',
      mimeType: 'image/png',
      buffer: await createSyntheticOcrPng(page),
    })

  const editor = page.getByRole('textbox', {
    name: 'Texto do laudo ou relatório',
  })
  await expect(editor).toHaveValue(/LAUDO\s+SINTETICO\s+CORACAO/i, {
    timeout: 30_000,
  })
  await expect(page.getByText('laudo-ocr.png')).toBeVisible()
  await expect(page.getByText(/1\.000×260 px .* OCR local/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Encontrar anatomia' })).toBeEnabled()
  await expect(page.getByText('ESTRUTURAS ENCONTRADAS')).toHaveCount(0)

  expect(ocrRequests.some((path) => path.endsWith('/worker.min.js'))).toBeTruthy()
  expect(
    ocrRequests.some(
      (path) => path.includes('/core/tesseract-core-') && path.endsWith('.wasm.js'),
    ),
  ).toBeTruthy()
  expect(
    ocrRequests.some((path) => path.endsWith('/lang/por.traineddata.gz')),
  ).toBeTruthy()
  expect(remoteOcrRequests).toEqual([])
})

test('demotes anatomy analysis after the current structure is confirmed', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Relatórios' }).click()

  const reanalyze = page.getByRole('button', { name: 'Reanalisar laudo' })
  await expect(reanalyze).toBeVisible()
  await expect(reanalyze).toHaveClass(/reanalyze/)
  await expect(
    page.getByText('Use apenas se precisar refazer a correspondência anatômica.'),
  ).toBeVisible()

  const editor = page.getByRole('textbox', {
    name: 'Texto do laudo ou relatório',
  })
  await editor.fill('Novo texto sintético sobre coração para reconfirmação.')

  const analyze = page.getByRole('button', { name: 'Encontrar anatomia' })
  await expect(analyze).toBeVisible()
  await expect(analyze).toHaveClass(/primary/)
})
