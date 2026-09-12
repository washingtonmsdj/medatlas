import { createHash } from 'node:crypto'
import { copyFile, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

const outputRoot = 'public/ocr-assets'
const coreOutput = path.join(outputRoot, 'core')
const langOutput = path.join(outputRoot, 'lang')
const workerSource = 'node_modules/tesseract.js/dist/worker.min.js'
const coreSource = 'node_modules/tesseract.js-core'
const languageCandidates = [
  'node_modules/@tesseract.js-data/por/4.0.0_best_int/por.traineddata.gz',
  'node_modules/@tesseract.js-data/por/4.0.0/por.traineddata.gz',
]
const requiredLstmCoreFiles = [
  'tesseract-core-lstm.wasm.js',
  'tesseract-core-lstm.wasm',
  'tesseract-core-simd-lstm.wasm.js',
  'tesseract-core-simd-lstm.wasm',
  'tesseract-core-relaxedsimd-lstm.wasm.js',
  'tesseract-core-relaxedsimd-lstm.wasm',
]

const readPackageVersion = async (packagePath, expectedName) => {
  const parsed = JSON.parse(await readFile(packagePath, 'utf8'))
  if (parsed.name !== expectedName || typeof parsed.version !== 'string') {
    throw new Error(`Unexpected package metadata for ${expectedName}`)
  }
  return parsed.version
}

const sha256 = async (filePath) => {
  const payload = await readFile(filePath)
  return createHash('sha256').update(payload).digest('hex')
}

const findLanguageSource = async () => {
  for (const candidate of languageCandidates) {
    try {
      await readFile(candidate)
      return candidate
    } catch {
      // Try the next known package layout.
    }
  }
  throw new Error('Portuguese Tesseract traineddata was not found in the pinned package.')
}

await rm(outputRoot, { recursive: true, force: true })
await mkdir(coreOutput, { recursive: true })
await mkdir(langOutput, { recursive: true })

const installedCoreFiles = new Set(await readdir(coreSource))
const missingCoreFiles = requiredLstmCoreFiles.filter(
  (filename) => !installedCoreFiles.has(filename),
)

if (missingCoreFiles.length > 0) {
  throw new Error(
    `Pinned Tesseract core is missing required LSTM runtime files: ${missingCoreFiles.join(', ')}`,
  )
}

await copyFile(workerSource, path.join(outputRoot, 'worker.min.js'))
for (const filename of requiredLstmCoreFiles) {
  await copyFile(path.join(coreSource, filename), path.join(coreOutput, filename))
}

const languageSource = await findLanguageSource()
await copyFile(languageSource, path.join(langOutput, 'por.traineddata.gz'))

const tesseractVersion = await readPackageVersion(
  'node_modules/tesseract.js/package.json',
  'tesseract.js',
)
const coreVersion = await readPackageVersion(
  'node_modules/tesseract.js-core/package.json',
  'tesseract.js-core',
)
const languageVersion = await readPackageVersion(
  'node_modules/@tesseract.js-data/por/package.json',
  '@tesseract.js-data/por',
)

const manifestFiles = [
  'worker.min.js',
  ...requiredLstmCoreFiles.map((filename) => `core/${filename}`),
  'lang/por.traineddata.gz',
]
const files = Object.fromEntries(
  await Promise.all(
    manifestFiles.map(async (relativePath) => {
      const filePath = path.join(outputRoot, relativePath)
      const bytes = (await stat(filePath)).size
      return [
        relativePath,
        {
          sha256: await sha256(filePath),
          bytes,
        },
      ]
    }),
  ),
)
const totalBytes = Object.values(files).reduce(
  (total, file) => total + file.bytes,
  0,
)

const manifest = {
  schema: 'medatlas.ocr-assets/2',
  generatedFromDependencies: true,
  tesseractVersion,
  coreVersion,
  languagePackage: '@tesseract.js-data/por',
  languageVersion,
  language: 'por',
  totalBytes,
  files,
}

await writeFile(
  path.join(outputRoot, 'manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
  'utf8',
)

console.log(
  `Prepared local OCR assets: Tesseract.js ${tesseractVersion}, core ${coreVersion}, por ${languageVersion}, ${manifestFiles.length} runtime files, ${totalBytes} bytes total.`,
)
for (const [relativePath, metadata] of Object.entries(files)) {
  console.log(`- ${relativePath}: ${metadata.bytes} bytes`)
}
