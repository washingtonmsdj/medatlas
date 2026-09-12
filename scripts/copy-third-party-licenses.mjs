import { copyFile, mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const outputDirectory = 'dist/licenses'

const licenses = [
  {
    source: 'node_modules/pdfjs-dist/LICENSE',
    output: 'pdfjs-LICENSE.txt',
    label: 'PDF.js',
  },
  {
    source: 'node_modules/tesseract.js/LICENSE.md',
    output: 'tesseractjs-LICENSE.txt',
    label: 'Tesseract.js',
  },
  {
    source: 'node_modules/tesseract.js-core/LICENSE',
    output: 'tesseractjs-core-LICENSE.txt',
    label: 'Tesseract.js core',
  },
]

await mkdir(outputDirectory, { recursive: true })

for (const license of licenses) {
  const text = await readFile(license.source, 'utf8')

  if (
    !text.includes('Apache License') ||
    !text.includes('Version 2.0, January 2004')
  ) {
    throw new Error(
      `Unexpected ${license.label} license payload; refusing to package it.`,
    )
  }

  const output = path.join(outputDirectory, license.output)
  await copyFile(license.source, output)
  console.log(`Copied ${license.label} Apache-2.0 license to ${output}`)
}
