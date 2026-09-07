import { readdir, stat } from 'node:fs/promises'
import path from 'node:path'

const assetsRoot = 'dist/assets'
const files = await readdir(assetsRoot)
const jsFiles = files.filter((filename) => filename.endsWith('.js'))

if (jsFiles.length < 2) {
  console.error(
    'MedAtlas bundle budget FAILED: expected code-split JavaScript chunks.',
  )
  process.exit(1)
}

const entries = []
let totalBytes = 0

for (const filename of jsFiles) {
  const bytes = (await stat(path.join(assetsRoot, filename))).size
  totalBytes += bytes
  entries.push({ filename, bytes })
}

entries.sort((a, b) => b.bytes - a.bytes)

const initialEntry =
  entries.find((entry) => entry.filename.startsWith('index-')) ??
  entries[entries.length - 1]

const budgets = {
  initialEntryBytes: 450_000,
  totalJavaScriptBytes: 1_100_000,
}

const failures = []

if (!initialEntry) {
  failures.push('could not identify the Vite entry chunk')
} else if (initialEntry.bytes > budgets.initialEntryBytes) {
  failures.push(
    `initial entry ${initialEntry.filename} is ${initialEntry.bytes} bytes; budget is ${budgets.initialEntryBytes}`,
  )
}

if (totalBytes > budgets.totalJavaScriptBytes) {
  failures.push(
    `total JavaScript is ${totalBytes} bytes; budget is ${budgets.totalJavaScriptBytes}`,
  )
}

if (failures.length > 0) {
  console.error('MedAtlas bundle budget FAILED')
  failures.forEach((failure) => console.error('- ' + failure))
  console.error(JSON.stringify(entries, null, 2))
  process.exit(1)
}

console.log('MedAtlas bundle budget PASS')
console.log(
  `- initial entry: ${initialEntry.filename} · ${initialEntry.bytes} bytes`,
)
console.log(`- JavaScript chunks: ${jsFiles.length}`)
console.log(`- total JavaScript: ${totalBytes} bytes`)
