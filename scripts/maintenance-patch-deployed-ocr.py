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
'''
text = text.replace(marker, ocr_test + marker, 1)
preview.write_text(text)

pages = Path('.github/workflows/pages.yml')
yaml = pages.read_text()

path_marker = "      - 'package-lock.json'\n      - 'vite.config.ts'"
if yaml.count(path_marker) != 1:
    raise SystemExit('unexpected Pages path-filter marker')
yaml = yaml.replace(
    path_marker,
    "      - 'package-lock.json'\n      - 'scripts/prepare-ocr-assets.mjs'\n      - 'vite.config.ts'",
    1,
)

log_marker = "          console.log(`MedAtlas Pages preview PASS: ${pageUrl}`)"
if yaml.count(log_marker) != 1:
    raise SystemExit('unexpected Pages verification insertion marker')

ocr_verify = r'''          const ocrManifestResponse = await fetchOk(
            new URL('ocr-assets/manifest.json', pageUrl),
          )
          const ocrManifest = await ocrManifestResponse.json()
          const ocrEntries = Object.entries(ocrManifest?.files ?? {})

          if (
            ocrManifest?.schema !== 'medatlas.ocr-assets/2' ||
            ocrManifest?.generatedFromDependencies !== true ||
            ocrManifest?.tesseractVersion !== '7.0.0' ||
            ocrManifest?.coreVersion !== '7.0.0' ||
            ocrManifest?.languagePackage !== '@tesseract.js-data/por' ||
            ocrManifest?.languageVersion !== '1.0.0' ||
            ocrManifest?.language !== 'por' ||
            ocrEntries.length !== 8
          ) {
            throw new Error('published_ocr_manifest_invalid')
          }

          let verifiedOcrBytes = 0
          for (const [relativePath, asset] of ocrEntries) {
            if (
              typeof asset?.bytes !== 'number' ||
              asset.bytes <= 0 ||
              typeof asset?.sha256 !== 'string' ||
              !/^[a-f0-9]{64}$/.test(asset.sha256)
            ) {
              throw new Error(`published_ocr_manifest_entry_invalid:${relativePath}`)
            }

            const response = await fetchOk(
              new URL(`ocr-assets/${relativePath}`, pageUrl),
            )
            const buffer = Buffer.from(await response.arrayBuffer())
            if (buffer.length !== asset.bytes) {
              throw new Error(`published_ocr_asset_size_mismatch:${relativePath}`)
            }

            const digest = createHash('sha256').update(buffer).digest('hex')
            if (digest !== asset.sha256) {
              throw new Error(`published_ocr_asset_sha256_mismatch:${relativePath}`)
            }
            verifiedOcrBytes += buffer.length
          }

          if (verifiedOcrBytes !== ocrManifest.totalBytes) {
            throw new Error('published_ocr_total_bytes_mismatch')
          }

'''
yaml = yaml.replace(log_marker, ocr_verify + log_marker, 1)
yaml = yaml.replace(
    'Validated ${assetRefs.length} JS/CSS asset(s) + Human Atlas provenance/index + 9 organ GLBs.',
    'Validated ${assetRefs.length} JS/CSS asset(s) + Human Atlas provenance/index + 9 organ GLBs + ${ocrEntries.length} OCR assets (${verifiedOcrBytes} bytes).',
    1,
)
pages.write_text(yaml)
