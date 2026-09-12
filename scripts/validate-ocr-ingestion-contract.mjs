import { readFile } from 'node:fs/promises'

const failures = []
const read = (file) => readFile(file, 'utf8')

const [
  constraints,
  contracts,
  metadata,
  ocr,
  pdf,
  scannedPdfOcr,
  router,
  intake,
  assetPrep,
  packageJson,
] = await Promise.all([
  read('src/product/constraints.ts'),
  read('src/ingestion/contracts.ts'),
  read('src/ingestion/image-metadata.ts'),
  read('src/ingestion/local-image-ocr.ts'),
  read('src/ingestion/pdf.ts'),
  read('src/ingestion/scanned-pdf-ocr.ts'),
  read('src/ingestion/local-report-file.ts'),
  read('src/components/ReportIntake.tsx'),
  read('scripts/prepare-ocr-assets.mjs'),
  read('package.json'),
])

const required = [
  [constraints, 'localImage:', 'central image constraints'],
  [constraints, 'maxBytes: 6 * 1024 * 1024', 'image byte limit'],
  [constraints, 'maxDimension: 4096', 'image side limit'],
  [constraints, 'maxPixels: 4_500_000', 'image pixel limit'],
  [constraints, 'maxExtractedTextBytes: 64 * 1024', 'image OCR text limit'],
  [constraints, "extensions: ['.png', '.jpg', '.jpeg'] as const", 'image extensions'],
  [constraints, "mimeTypes: ['image/png', 'image/jpeg'] as const", 'image MIME types'],
  [constraints, 'localPdfOcr:', 'scanned PDF OCR constraints'],
  [constraints, 'maxPages: 8', 'scanned PDF OCR page limit'],
  [constraints, 'maxRenderScale: 2', 'scanned PDF render scale limit'],
  [constraints, 'maxRenderDimension: 2400', 'scanned PDF render dimension limit'],
  [constraints, 'maxRenderPixelsPerPage: 2_500_000', 'scanned PDF per-page pixel limit'],
  [constraints, 'maxTotalRenderPixels: 16_000_000', 'scanned PDF total pixel limit'],
  [constraints, 'maxEmbeddedImagePixels: 12_000_000', 'scanned PDF embedded-image limit'],
  [contracts, "| 'invalid-dimensions'", 'image dimension failure contract'],
  [contracts, "| 'too-many-pixels'", 'image/PDF pixel failure contract'],
  [contracts, "| 'too-many-ocr-pages'", 'scanned PDF page failure contract'],
  [contracts, "| 'render-failed'", 'scanned PDF render failure contract'],
  [contracts, "| 'ocr-runtime-unavailable'", 'OCR runtime failure contract'],
  [contracts, "| 'ocr-failed'", 'OCR recognition failure contract'],
  [contracts, "| 'cancelled'", 'OCR cancellation contract'],
  [contracts, "format: 'text' | 'pdf' | 'image'", 'image ingestion result identity'],
  [contracts, 'ocrPageCount?: number', 'scanned PDF OCR provenance'],
  [contracts, 'signal?: AbortSignal', 'OCR abort signal contract'],
  [contracts, 'onOcrProgress?:', 'OCR progress contract'],
  [metadata, 'const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47', 'PNG signature gate'],
  [metadata, 'const JPEG_START_OF_FRAME_MARKERS', 'JPEG structural parser'],
  [metadata, 'localImageMimeMatchesKind', 'extension/MIME kind binding'],
  [ocr, 'DEMO_CONSTRAINTS.localImage.maxBytes', 'OCR source size gate'],
  [ocr, 'parseLocalImageMetadata(', 'OCR metadata gate'],
  [ocr, 'DEMO_CONSTRAINTS.localImage.maxDimension', 'OCR dimension gate'],
  [ocr, 'DEMO_CONSTRAINTS.localImage.maxPixels', 'OCR pixel gate'],
  [ocr, "await import('tesseract.js')", 'lazy Tesseract import'],
  [ocr, 'import.meta.env.BASE_URL', 'deploy-relative OCR asset root'],
  [ocr, 'workerPath: `${ocrRoot}/worker.min.js`', 'local OCR worker path'],
  [ocr, 'corePath: `${ocrRoot}/core`', 'local OCR core path'],
  [ocr, 'langPath: `${ocrRoot}/lang`', 'local OCR language path'],
  [ocr, 'workerBlobURL: false', 'direct same-origin OCR worker without blob indirection'],
  [ocr, "createWorker('por', OEM.LSTM_ONLY", 'pinned Portuguese OCR initialization'],
  [ocr, 'validateDemoReportSource(text)', 'OCR text downstream validation'],
  [ocr, 'await worker.terminate()', 'OCR worker teardown'],
  [ocr, "format: 'image'", 'OCR image result identity'],
  [pdf, "await import('./scanned-pdf-ocr')", 'lazy scanned PDF fallback'],
  [pdf, 'ingestScannedPdfBuffer(file, buffer, options)', 'scanned PDF option propagation'],
  [scannedPdfOcr, "from 'pdfjs-dist'", 'scanned PDF uses canonical PDF.js'],
  [scannedPdfOcr, 'DEMO_CONSTRAINTS.localPdfOcr', 'scanned PDF central limits'],
  [scannedPdfOcr, 'maxImageSize: limits.maxEmbeddedImagePixels', 'embedded image pixel cap'],
  [scannedPdfOcr, 'pageRenderScale(', 'bounded PDF page scale'],
  [scannedPdfOcr, 'limits.maxRenderPixelsPerPage', 'bounded PDF page pixels'],
  [scannedPdfOcr, 'limits.maxTotalRenderPixels', 'bounded PDF total pixels'],
  [scannedPdfOcr, "await import('./local-image-ocr')", 'reuse canonical image OCR boundary'],
  [scannedPdfOcr, 'page.render({', 'local PDF rasterization'],
  [scannedPdfOcr, "canvas.toBlob(resolve, 'image/jpeg', quality)", 'bounded raster handoff'],
  [scannedPdfOcr, "format: 'pdf'", 'scanned PDF result identity'],
  [scannedPdfOcr, 'ocrPageCount: pdf.numPages', 'scanned PDF OCR page provenance'],
  [scannedPdfOcr, 'options.signal?.aborted', 'scanned PDF cancellation checks'],
  [scannedPdfOcr, "renderTask.cancel()", 'PDF render cancellation'],
  [router, "await import('./local-image-ocr')", 'lazy image OCR routing'],
  [router, "await import('./pdf')", 'lazy PDF routing'],
  [router, 'return ingestLocalPdfFile(file, options)', 'PDF progress/cancel propagation'],
  [router, 'isDemoImageFilenameAllowed(file.name)', 'image OCR routing gate'],
  [intake, 'new AbortController()', 'OCR UI cancellation controller'],
  [intake, 'isDemoPdfFilenameAllowed(file.name)', 'scanned PDF cancellation controller'],
  [intake, 'isImage || isPdf ? new AbortController()', 'shared image/PDF OCR cancellation'],
  [intake, 'Cancelar OCR', 'OCR cancel UI'],
  [intake, 'Progresso do OCR local', 'OCR progress accessibility'],
  [intake, 'importingFile ||', 'anatomy analysis blocked during OCR'],
  [assetPrep, "const outputRoot = 'public/ocr-assets'", 'local OCR asset output'],
  [assetPrep, "node_modules/tesseract.js/dist/worker.min.js", 'pinned worker source'],
  [assetPrep, "node_modules/tesseract.js-core", 'pinned core source'],
  [assetPrep, "@tesseract.js-data/por", 'pinned Portuguese model source'],
  [assetPrep, "createHash('sha256')", 'OCR asset integrity manifest'],
  [packageJson, '"tesseract.js": "7.0.0"', 'Tesseract dependency pin'],
  [packageJson, '"@tesseract.js-data/por": "1.0.0"', 'Portuguese model dependency pin'],
  [packageJson, '"prepare:ocr-assets": "node scripts/prepare-ocr-assets.mjs"', 'OCR asset preparation script'],
  [packageJson, '"dev": "npm run prepare:ocr-assets && vite', 'OCR assets prepared for development'],
  [packageJson, '"build": "npm run prepare:ocr-assets && tsc', 'OCR assets prepared for production build'],
]

for (const [source, fragment, scope] of required) {
  if (!source.includes(fragment)) {
    failures.push(`${scope} missing invariant: ${fragment}`)
  }
}

const metadataIndex = ocr.indexOf('parseLocalImageMetadata(')
const runtimeIndex = ocr.indexOf("await import('tesseract.js')")
if (metadataIndex === -1 || runtimeIndex === -1 || metadataIndex > runtimeIndex) {
  failures.push('image signature/dimension validation must happen before Tesseract is loaded')
}

const scannedLimitsIndex = scannedPdfOcr.indexOf('pageRenderScale(')
const scannedOcrIndex = scannedPdfOcr.indexOf("await import('./local-image-ocr')")
if (
  scannedLimitsIndex === -1 ||
  scannedOcrIndex === -1 ||
  scannedLimitsIndex > scannedOcrIndex
) {
  failures.push('scanned PDF render limits must be established before image OCR is loaded')
}

for (const [source, scope] of [
  [ocr, 'image OCR ingestion'],
  [scannedPdfOcr, 'scanned PDF OCR ingestion'],
]) {
  if (/\bfetch\s*\(|new\s+XMLHttpRequest|https?:\/\//i.test(source)) {
    failures.push(`${scope} must not fetch runtime/model/document assets from remote URLs`)
  }
}

if (router.includes("from './local-image-ocr'")) {
  failures.push('Tesseract OCR must remain dynamically imported, not eager-loaded')
}

if (pdf.includes("from './scanned-pdf-ocr'")) {
  failures.push('scanned PDF OCR must remain dynamically imported after text extraction fails')
}

if (/\bfile\.(?:text|arrayBuffer)\s*\(/.test(intake)) {
  failures.push('ReportIntake must not read file bytes; OCR/PDF decoding belongs to src/ingestion')
}

if (!router.includes('...DEMO_CONSTRAINTS.localImage.extensions')) {
  failures.push('report file accept contract must include bounded image extensions')
}

if (!router.includes('...DEMO_CONSTRAINTS.localImage.mimeTypes')) {
  failures.push('report file accept contract must include bounded image MIME types')
}

if (failures.length > 0) {
  console.error('MedAtlas OCR ingestion contract FAILED')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log('MedAtlas OCR ingestion contract PASS')
console.log('- PNG/JPEG are bounded and structurally validated before OCR runtime loading.')
console.log('- Tesseract worker/core/Portuguese model are local, pinned, lazy and direct same-origin.')
console.log('- Image-only PDFs use bounded local PDF.js rasterization before the same OCR boundary.')
console.log('- Scanned PDF OCR is page/pixel bounded, cancellable and separate from anatomy analysis.')
