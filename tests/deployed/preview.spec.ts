import { expect, test, type Page } from '@playwright/test'
import { createSyntheticOcrPng } from './ocr-fixture'

function createSyntheticPdf(text = 'Laudo sintetico publicado sobre L4-L5.') {
  const escapedText = text
    .replaceAll('\\', '\\\\')
    .replaceAll('(', '\\(')
    .replaceAll(')', '\\)')
  const stream = `BT /F1 12 Tf 72 720 Td (${escapedText}) Tj ET`
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

async function openBlankReport(page: Page) {
  await page.goto('./')

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

test('published MedAtlas preview loads the SaaS shell and real clinical 3D flow', async ({
  page,
}) => {
  await page.goto('./')

  await expect(
    page.getByRole('heading', {
      name: 'Atendimento em andamento',
    }),
  ).toBeVisible()

  await expect(page).toHaveTitle(/Comunicação clínica visual em 3D/)

  const contextualSurfaces = [
    {
      button: null,
      selector: '.overview-atlas-panel .anatomy-focus-preview',
    },
    {
      button: 'Pacientes',
      selector: '.patient-anatomy-live .anatomy-focus-preview',
    },
  ]

  for (const surface of contextualSurfaces) {
    if (surface.button) {
      await page.getByRole('button', { name: surface.button, exact: true }).click()
    }

    const preview = page.locator(surface.selector)
    await expect(preview).toBeVisible()
    await expect(preview.locator('.human-atlas-scene canvas')).toBeVisible({
      timeout: 45_000,
    })
    await expect(
      preview.getByText('3D carregado', { exact: true }),
    ).toBeVisible({ timeout: 45_000 })
  }

  await page.getByRole('button', { name: 'Relatórios' }).click()
  await expect(
    page.getByRole('heading', { name: 'Adicionar laudo' }),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Coração', exact: true }).click()
  await page.getByRole('button', { name: 'Encontrar anatomia' }).click()

  const heartSuggestion = page
    .locator('.suggestion-item')
    .filter({ hasText: 'Coração' })

  await expect(heartSuggestion).toContainText('Coração')
  await heartSuggestion
    .getByRole('button', { name: 'Usar estrutura' })
    .click()

  await expect(page.locator('.finding-card-studio.anatomy-confirmed')).toBeVisible()

  const focusedScene = page.locator('.clinical-atlas-stage .human-atlas-scene')
  await expect(focusedScene).toBeVisible()

  await expect
    .poll(
      async () => focusedScene.locator('canvas').count(),
      {
        timeout: 45_000,
        message: 'Human Atlas canvas should render from deployed anatomy assets',
      },
    )
    .toBeGreaterThan(0)

  await expect(
    page.getByText('ESTRUTURA EM FOCO', { exact: true }),
  ).toBeVisible({ timeout: 45_000 })

  const draftButton = page.getByRole('button', {
    name: 'Gerar rascunho',
  })
  await expect(draftButton).toBeEnabled()
  await draftButton.click()

  await expect(page.getByLabel('Explicação para o paciente')).toContainText(
    'tórax',
  )

  await page
    .locator('.patient-preview-control')
    .getByRole('button', { name: 'Prévia do paciente' })
    .click()

  await expect(page.locator('.patient-shell')).toBeVisible()
  await expect(page.getByText('VISÃO DO PACIENTE · PRÉVIA')).toBeVisible()
  await expect(
    page.locator('#patient-anatomy .human-atlas-scene canvas'),
  ).toBeVisible({ timeout: 45_000 })

  const patientDepth = page.getByRole('navigation', {
    name: 'Nível da anatomia 3D',
  })
  await expect(patientDepth).toBeVisible()

  await patientDepth
    .getByRole('button', { name: 'Ver Coração em detalhe' })
    .click()

  await expect(
    page.locator(
      '#patient-anatomy .organ-detail-scene[data-organ="heart"] canvas',
    ),
  ).toBeVisible({ timeout: 45_000 })
  await expect(page.locator('.patient-organ-detail-safety')).toContainText(
    'não representa o corpo individual do paciente',
  )
  await expect(page.locator('.patient-shell')).not.toContainText('FMA7088')

  await patientDepth
    .getByRole('button', { name: 'Corpo completo' })
    .click()
  await expect(
    page.locator('#patient-anatomy .human-atlas-scene canvas'),
  ).toBeVisible({ timeout: 45_000 })

  await page
    .getByRole('button', { name: 'Voltar ao profissional' })
    .click()

  await expect(
    page.getByRole('heading', { name: 'Adicionar laudo' }),
  ).toBeVisible()

  await page
    .getByRole('button', { name: 'Aprovar explicação' })
    .click()

  const publish = page.getByRole('button', {
    name: 'Compartilhar com paciente',
  })
  await expect(publish).toBeEnabled()
  await publish.click()

  await expect(page.getByText('Link pronto')).toBeVisible()

  const [patientPage] = await Promise.all([
    page.waitForEvent('popup'),
    page.getByRole('button', { name: 'Abrir link' }).click(),
  ])

  await patientPage.waitForLoadState('domcontentloaded')
  await expect(
    patientPage.getByText('SEU RELATÓRIO VISUAL'),
  ).toBeVisible()
  await expect(
    patientPage.getByRole('heading', { name: 'Entenda seu exame — coração' }),
  ).toBeVisible()
  await expect(
    patientPage.locator('#patient-anatomy .human-atlas-scene canvas'),
  ).toBeVisible({ timeout: 45_000 })
})

test('published PDF ingestion loads its local worker under the Pages base path', async ({
  page,
}) => {
  await openBlankReport(page)

  const workerResponses: string[] = []
  page.on('response', (response) => {
    if (response.url().includes('pdf.worker.min-')) {
      workerResponses.push(response.url())
    }
  })

  await page
    .getByLabel('Importar laudo sintético em TXT, MD, PDF, PNG ou JPG')
    .setInputFiles({
      name: 'laudo-publicado.pdf',
      mimeType: 'application/pdf',
      buffer: createSyntheticPdf(),
    })

  const editor = page.getByRole('textbox', {
    name: 'Texto do laudo ou relatório',
  })
  await expect(editor).toHaveValue(/Laudo sintetico publicado sobre L4-L5\./)
  await expect(page.getByText('laudo-publicado.pdf')).toBeVisible()
  await expect(page.getByText(/1 página · .* bytes extraídos/)).toBeVisible()
  await expect(page.getByText('ESTRUTURAS ENCONTRADAS')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Encontrar anatomia' })).toBeEnabled()

  expect(workerResponses.length).toBeGreaterThan(0)
  expect(workerResponses.every((url) => url.includes('/medatlas/assets/'))).toBe(true)
})


test('published PNG OCR uses only direct same-origin assets under the Pages base path', async ({
  page,
}) => {
  test.setTimeout(120_000)
  await openBlankReport(page)

  const origin = new URL(page.url()).origin
  const ocrRequests: string[] = []
  const remoteOcrRequests: string[] = []
  const workerUrls: string[] = []

  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.pathname.includes('/ocr-assets/')) {
      ocrRequests.push(request.url())
    }
    if (
      url.origin !== origin &&
      /tesseract|traineddata|jsdelivr|unpkg|projectnaptha/i.test(request.url())
    ) {
      remoteOcrRequests.push(request.url())
    }
  })
  page.on('worker', (worker) => workerUrls.push(worker.url()))

  await page
    .getByLabel('Importar laudo sintético em TXT, MD, PDF, PNG ou JPG')
    .setInputFiles({
      name: 'laudo-ocr-publicado.png',
      mimeType: 'image/png',
      buffer: await createSyntheticOcrPng(page),
    })

  const editor = page.getByRole('textbox', {
    name: 'Texto do laudo ou relatório',
  })
  await expect(editor).toHaveValue(/LAUDO\s+SINTETICO\s+CORACAO/i, {
    timeout: 45_000,
  })
  await expect(page.getByText('laudo-ocr-publicado.png')).toBeVisible()
  await expect(page.getByText(/1\.000×260 px .* OCR local/)).toBeVisible()
  await expect(page.getByText('ESTRUTURAS ENCONTRADAS')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Encontrar anatomia' })).toBeEnabled()

  const parsedOcrRequests = ocrRequests.map((value) => new URL(value))
  expect(
    parsedOcrRequests.some(
      (url) => url.pathname === '/medatlas/ocr-assets/worker.min.js',
    ),
  ).toBeTruthy()
  expect(
    parsedOcrRequests.some(
      (url) =>
        url.pathname.startsWith('/medatlas/ocr-assets/core/tesseract-core-') &&
        url.pathname.endsWith('.wasm.js'),
    ),
  ).toBeTruthy()
  expect(
    parsedOcrRequests.some(
      (url) => url.pathname === '/medatlas/ocr-assets/lang/por.traineddata.gz',
    ),
  ).toBeTruthy()
  expect(parsedOcrRequests.every((url) => url.origin === origin)).toBe(true)
  expect(remoteOcrRequests).toEqual([])
  expect(workerUrls.some((url) => url.includes('/medatlas/ocr-assets/worker.min.js'))).toBe(true)
  expect(workerUrls.some((url) => url.startsWith('blob:'))).toBe(false)
})

test('published Atlas uses the concept body-plus-detail layout on mobile', async ({
  page,
}) => {
  test.setTimeout(120_000)

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('./')

  await page.getByRole('button', { name: 'Mais módulos' }).click()
  const mobileModules = page.locator('#clinical-sidebar-more-menu')
  await expect(mobileModules).toBeVisible()
  await mobileModules
    .getByRole('button', { name: 'Atlas 3D', exact: true })
    .click()

  const workspace = page.locator('.reference-atlas-workspace')
  const stage = page.locator('.reference-atlas-body-stage')
  const canvas = stage.locator('.reference-atlas-scene canvas')

  await expect(workspace).toBeVisible()
  await expect(canvas).toBeVisible({ timeout: 100_000 })

  const stageBox = await stage.boundingBox()
  expect(stageBox).not.toBeNull()
  expect(stageBox!.height).toBeGreaterThanOrEqual(600)

  await expect(
    page.getByRole('complementary', { name: 'Sistemas anatômicos' }),
  ).toBeVisible()
  await expect(
    page.getByRole('navigation', { name: 'Atalhos do Atlas 3D' }),
  ).toBeVisible()
  await expect(page.locator('.reference-atlas-detail-panel')).toBeVisible()

  const search = page.locator('#reference-atlas-search')
  await search.fill('Coração')
  await page
    .locator('.reference-atlas-results button')
    .filter({ hasText: 'FMA7088' })
    .first()
    .click()

  await expect(canvas).toBeVisible()
  await expect(
    page.locator(
      '.reference-atlas-organ-stage .organ-detail-scene[data-organ="heart"] canvas',
    ),
  ).toBeVisible({ timeout: 45_000 })

  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth + 1,
  )
  expect(overflow).toBe(false)
})
