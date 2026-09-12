import { readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'

const assetsRoot = 'dist/assets'
const files = await readdir(assetsRoot)
const jsFiles = files.filter((filename) => filename.endsWith('.js'))

if (jsFiles.length < 3) {
  console.error(
    'MedAtlas bundle budget FAILED: expected code-split JavaScript chunks.',
  )
  process.exit(1)
}

const entries = []
let totalJavaScriptBytes = 0

for (const filename of jsFiles) {
  const bytes = (await stat(path.join(assetsRoot, filename))).size
  totalJavaScriptBytes += bytes
  entries.push({ filename, bytes })
}

entries.sort((a, b) => b.bytes - a.bytes)

const initialEntry = entries.find((entry) => entry.filename.startsWith('index-'))
const pdfParserEntry = entries.find((entry) => entry.filename.startsWith('pdf-'))
const ocrBridgeEntry = entries.find((entry) =>
  entry.filename.startsWith('local-image-ocr-'),
)
const pdfWorkerFilename = files.find((filename) =>
  filename.startsWith('pdf.worker.min-'),
)
const pdfWorkerBytes = pdfWorkerFilename
  ? (await stat(path.join(assetsRoot, pdfWorkerFilename))).size
  : 0
const coreJavaScriptBytes = pdfParserEntry
  ? totalJavaScriptBytes - pdfParserEntry.bytes
  : totalJavaScriptBytes

const ocrManifest = JSON.parse(
  await readFile('dist/ocr-assets/manifest.json', 'utf8'),
)
const requiredOcrFiles = [
  'worker.min.js',
  'core/tesseract-core-lstm.wasm.js',
  'core/tesseract-core-lstm.wasm',
  'core/tesseract-core-simd-lstm.wasm.js',
  'core/tesseract-core-simd-lstm.wasm',
  'core/tesseract-core-relaxedsimd-lstm.wasm.js',
  'core/tesseract-core-relaxedsimd-lstm.wasm',
  'lang/por.traineddata.gz',
]
const ocrEntries = []
for (const relativePath of requiredOcrFiles) {
  const bytes = (
    await stat(path.join('dist/ocr-assets', relativePath)).catch(() => null)
  )?.size
  ocrEntries.push({ relativePath, bytes: bytes ?? 0 })
}
const ocrEntryMap = new Map(
  ocrEntries.map((entry) => [entry.relativePath, entry.bytes]),
)
const ocrDistributedBytes = ocrEntries.reduce(
  (total, entry) => total + entry.bytes,
  0,
)
const ocrWorkerBytes = ocrEntryMap.get('worker.min.js') ?? 0
const ocrLanguageBytes = ocrEntryMap.get('lang/por.traineddata.gz') ?? 0
const ocrVariants = [
  ['baseline', 'core/tesseract-core-lstm.wasm.js', 'core/tesseract-core-lstm.wasm'],
  ['simd', 'core/tesseract-core-simd-lstm.wasm.js', 'core/tesseract-core-simd-lstm.wasm'],
  [
    'relaxedsimd',
    'core/tesseract-core-relaxedsimd-lstm.wasm.js',
    'core/tesseract-core-relaxedsimd-lstm.wasm',
  ],
].map(([name, loaderPath, wasmPath]) => ({
  name,
  loaderPath,
  wasmPath,
  loaderBytes: ocrEntryMap.get(loaderPath) ?? 0,
  wasmBytes: ocrEntryMap.get(wasmPath) ?? 0,
}))
const maxOcrLoadedSurfaceBytes = Math.max(
  ...ocrVariants.map(
    (variant) =>
      ocrWorkerBytes +
      ocrLanguageBytes +
      variant.loaderBytes +
      variant.wasmBytes,
  ),
)

const budgets = {
  initialEntryBytes: 450_000,
  coreJavaScriptBytes: 1_100_000,
  pdfParserChunkBytes: 500_000,
  pdfWorkerBytes: 1_350_000,
  pdfSurfaceBytes: 1_800_000,
  ocrBridgeChunkBytes: 10_000,
  ocrWorkerBytes: 125_000,
  ocrLanguageBytes: 1_500_000,
  ocrCoreLoaderBytes: 4_100_000,
  ocrCoreWasmBytes: 3_000_000,
  ocrLoadedSurfaceBytes: 8_500_000,
  ocrDistributedSurfaceBytes: 23_000_000,
}

const failures = []

if (!initialEntry) {
  failures.push('could not identify the Vite entry chunk')
} else if (initialEntry.bytes > budgets.initialEntryBytes) {
  failures.push(
    `initial entry ${initialEntry.filename} is ${initialEntry.bytes} bytes; budget is ${budgets.initialEntryBytes}`,
  )
}

if (coreJavaScriptBytes > budgets.coreJavaScriptBytes) {
  failures.push(
    `core JavaScript excluding the lazy PDF parser is ${coreJavaScriptBytes} bytes; budget is ${budgets.coreJavaScriptBytes}`,
  )
}

if (!pdfParserEntry) {
  failures.push('could not identify the lazy PDF parser chunk')
} else if (pdfParserEntry.bytes > budgets.pdfParserChunkBytes) {
  failures.push(
    `lazy PDF parser ${pdfParserEntry.filename} is ${pdfParserEntry.bytes} bytes; budget is ${budgets.pdfParserChunkBytes}`,
  )
}

if (!pdfWorkerFilename) {
  failures.push('could not identify the locally emitted PDF.js worker')
} else if (pdfWorkerBytes > budgets.pdfWorkerBytes) {
  failures.push(
    `PDF.js worker ${pdfWorkerFilename} is ${pdfWorkerBytes} bytes; budget is ${budgets.pdfWorkerBytes}`,
  )
}

if (
  pdfParserEntry &&
  pdfParserEntry.bytes + pdfWorkerBytes > budgets.pdfSurfaceBytes
) {
  failures.push(
    `lazy PDF surface is ${pdfParserEntry.bytes + pdfWorkerBytes} bytes; budget is ${budgets.pdfSurfaceBytes}`,
  )
}

if (!ocrBridgeEntry) {
  failures.push('could not identify the lazy local image OCR bridge chunk')
} else if (ocrBridgeEntry.bytes > budgets.ocrBridgeChunkBytes) {
  failures.push(
    `lazy OCR bridge ${ocrBridgeEntry.filename} is ${ocrBridgeEntry.bytes} bytes; budget is ${budgets.ocrBridgeChunkBytes}`,
  )
}

if (
  ocrManifest.schema !== 'medatlas.ocr-assets/2' ||
  ocrManifest.generatedFromDependencies !== true ||
  ocrManifest.tesseractVersion !== '7.0.0' ||
  ocrManifest.coreVersion !== '7.0.0' ||
  ocrManifest.languageVersion !== '1.0.0' ||
  ocrManifest.language !== 'por'
) {
  failures.push('OCR asset manifest provenance/version contract is invalid')
}

const manifestPaths = Object.keys(ocrManifest.files ?? {}).sort()
const expectedOcrPaths = [...requiredOcrFiles].sort()
if (JSON.stringify(manifestPaths) !== JSON.stringify(expectedOcrPaths)) {
  failures.push('OCR distribution must contain only the required LSTM runtime assets')
}

for (const entry of ocrEntries) {
  const manifestEntry = ocrManifest.files?.[entry.relativePath]
  if (
    entry.bytes === 0 ||
    manifestEntry?.bytes !== entry.bytes ||
    !/^[0-9a-f]{64}$/.test(manifestEntry?.sha256 ?? '')
  ) {
    failures.push(
      `OCR asset ${entry.relativePath} is missing or does not match its SHA/byte manifest`,
    )
  }
}

if (ocrManifest.totalBytes !== ocrDistributedBytes) {
  failures.push(
    `OCR manifest total is ${ocrManifest.totalBytes}; actual distribution is ${ocrDistributedBytes}`,
  )
}

if (ocrWorkerBytes > budgets.ocrWorkerBytes) {
  failures.push(
    `OCR worker is ${ocrWorkerBytes} bytes; budget is ${budgets.ocrWorkerBytes}`,
  )
}
if (ocrLanguageBytes > budgets.ocrLanguageBytes) {
  failures.push(
    `Portuguese OCR model is ${ocrLanguageBytes} bytes; budget is ${budgets.ocrLanguageBytes}`,
  )
}
for (const variant of ocrVariants) {
  if (variant.loaderBytes > budgets.ocrCoreLoaderBytes) {
    failures.push(
      `${variant.name} OCR core loader is ${variant.loaderBytes} bytes; budget is ${budgets.ocrCoreLoaderBytes}`,
    )
  }
  if (variant.wasmBytes > budgets.ocrCoreWasmBytes) {
    failures.push(
      `${variant.name} OCR core wasm is ${variant.wasmBytes} bytes; budget is ${budgets.ocrCoreWasmBytes}`,
    )
  }
}
if (maxOcrLoadedSurfaceBytes > budgets.ocrLoadedSurfaceBytes) {
  failures.push(
    `worst-case loaded OCR surface is ${maxOcrLoadedSurfaceBytes} bytes; budget is ${budgets.ocrLoadedSurfaceBytes}`,
  )
}
if (ocrDistributedBytes > budgets.ocrDistributedSurfaceBytes) {
  failures.push(
    `distributed OCR assets are ${ocrDistributedBytes} bytes; budget is ${budgets.ocrDistributedSurfaceBytes}`,
  )
}

const licensePairs = [
  [
    'PDF.js',
    'dist/licenses/pdfjs-LICENSE.txt',
    'node_modules/pdfjs-dist/LICENSE',
  ],
  [
    'Tesseract.js',
    'dist/licenses/tesseractjs-LICENSE.txt',
    'node_modules/tesseract.js/LICENSE.md',
  ],
  [
    'Tesseract.js core',
    'dist/licenses/tesseractjs-core-LICENSE.txt',
    'node_modules/tesseract.js-core/LICENSE',
  ],
]
for (const [label, packagedPath, installedPath] of licensePairs) {
  const packaged = await readFile(packagedPath, 'utf8').catch(() => '')
  const installed = await readFile(installedPath, 'utf8').catch(() => '')
  if (!packaged || packaged !== installed) {
    failures.push(
      `distributed ${label} license is missing or does not match the installed package license`,
    )
  }
}

if (failures.length > 0) {
  console.error('MedAtlas bundle budget FAILED')
  failures.forEach((failure) => console.error('- ' + failure))
  console.error(
    JSON.stringify(
      {
        entries,
        pdfWorker: pdfWorkerFilename
          ? { filename: pdfWorkerFilename, bytes: pdfWorkerBytes }
          : null,
        ocrEntries,
        maxOcrLoadedSurfaceBytes,
        ocrDistributedBytes,
      },
      null,
      2,
    ),
  )
  process.exit(1)
}

console.log('MedAtlas bundle budget PASS')
console.log(
  `- initial entry: ${initialEntry.filename} · ${initialEntry.bytes} bytes`,
)
console.log(`- core JavaScript without PDF: ${coreJavaScriptBytes} bytes`)
console.log(
  `- lazy PDF parser: ${pdfParserEntry.filename} · ${pdfParserEntry.bytes} bytes`,
)
console.log(`- local PDF worker: ${pdfWorkerFilename} · ${pdfWorkerBytes} bytes`)
console.log(
  `- lazy OCR bridge: ${ocrBridgeEntry.filename} · ${ocrBridgeEntry.bytes} bytes`,
)
console.log(
  `- worst-case loaded OCR runtime: ${maxOcrLoadedSurfaceBytes} bytes`,
)
console.log(`- distributed OCR assets: ${ocrDistributedBytes} bytes`)
console.log(`- JavaScript chunks: ${jsFiles.length}`)
console.log(`- total JavaScript: ${totalJavaScriptBytes} bytes`)
