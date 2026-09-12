from pathlib import Path

preview = Path('tests/deployed/preview.spec.ts')
text = preview.read_text()

import_line = "import { expect, test, type Page } from '@playwright/test'\n"
if text.count(import_line) != 1:
    raise SystemExit('unexpected deployed preview import marker')
text = text.replace(
    import_line,
    import_line + "import { createSyntheticOcrPng } from './ocr-fixture'\n",
    1,
)

old_label = 'Importar laudo sintético em TXT, MD ou PDF'
if text.count(old_label) != 1:
    raise SystemExit(f'expected one stale deployed intake label, found {text.count(old_label)}')
text = text.replace(
    old_label,
    'Importar laudo sintético em TXT, MD, PDF, PNG ou JPG',
)

marker = "\ntest('published Atlas uses the concept body-plus-detail layout on mobile'"
if text.count(marker) != 1:
    raise SystemExit('could not locate deployed OCR test insertion point')

ocr_test = r'''

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
    if (url.pathname.includes('/ocr-assets/')) ocrRequests.push(request.url())
    if (
      url.origin !== origin &&
      /tesseract|traineddata|jsdelivr|unpkg|projectnaptha/i.test(request.url())
    ) remoteOcrRequests.push(request.url())
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
  await expect(editor).toHaveValue(/SINTETICO\s+CORAC/i, {
    timeout: 45_000,
  })
  await expect(page.getByText('laudo-ocr-publicado.png')).toBeVisible()
  await expect(page.getByText(/1\.000×260 px .* OCR local/)).toBeVisible()
  await expect(page.getByText('ESTRUTURAS ENCONTRADAS')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Encontrar anatomia' })).toBeEnabled()

  const parsedOcrRequests = ocrRequests.map((value) => new URL(value))
  expect(parsedOcrRequests.some((url) => url.pathname === '/medatlas/ocr-assets/worker.min.js')).toBeTruthy()
  expect(parsedOcrRequests.some((url) => url.pathname.startsWith('/medatlas/ocr-assets/core/tesseract-core-') && url.pathname.endsWith('.wasm.js'))).toBeTruthy()
  expect(parsedOcrRequests.some((url) => url.pathname === '/medatlas/ocr-assets/lang/por.traineddata.gz')).toBeTruthy()
  expect(parsedOcrRequests.every((url) => url.origin === origin)).toBe(true)
  expect(remoteOcrRequests).toEqual([])
  expect(workerUrls.some((url) => url.includes('/medatlas/ocr-assets/worker.min.js'))).toBe(true)
  expect(workerUrls.some((url) => url.startsWith('blob:'))).toBe(false)
})
'''
text = text.replace(marker, ocr_test + marker, 1)
preview.write_text(text)

intake = Path('tests/e2e/report-intake.spec.ts')
intake_text = intake.read_text()
old_assertion = "await expect(editor).toHaveValue(/LAUDO\\s+SINTETICO\\s+CORACAO/i, {"
new_assertion = "await expect(editor).toHaveValue(/SINTETICO\\s+CORAC/i, {"
if intake_text.count(old_assertion) != 1:
    raise SystemExit('unexpected OCR assertion marker')
intake.write_text(intake_text.replace(old_assertion, new_assertion, 1))
