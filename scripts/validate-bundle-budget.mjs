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
const pdfWorkerFilename = files.find((filename) =>
  filename.startsWith('pdf.worker.min-'),
)
const pdfWorkerBytes = pdfWorkerFilename
  ? (await stat(path.join(assetsRoot, pdfWorkerFilename))).size
  : 0
const coreJavaScriptBytes = pdfParserEntry
  ? totalJavaScriptBytes - pdfParserEntry.bytes
  : totalJavaScriptBytes

const budgets = {
  initialEntryBytes: 450_000,
  coreJavaScriptBytes: 1_100_000,
  pdfParserChunkBytes: 500_000,
  pdfWorkerBytes: 1_350_000,
  pdfSurfaceBytes: 1_800_000,
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

const packagedPdfLicense = await readFile(
  'dist/licenses/pdfjs-LICENSE.txt',
  'utf8',
).catch(() => '')
const installedPdfLicense = await readFile(
  'node_modules/pdfjs-dist/LICENSE',
  'utf8',
).catch(() => '')

if (!packagedPdfLicense || packagedPdfLicense !== installedPdfLicense) {
  failures.push(
    'distributed PDF.js license is missing or does not match the installed package license',
  )
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
console.log(`- JavaScript chunks: ${jsFiles.length}`)
console.log(`- total JavaScript: ${totalJavaScriptBytes} bytes`)
