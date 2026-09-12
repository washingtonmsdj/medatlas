import { copyFile, mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const source = 'node_modules/pdfjs-dist/LICENSE'
const outputDirectory = 'dist/licenses'
const output = path.join(outputDirectory, 'pdfjs-LICENSE.txt')

const license = await readFile(source, 'utf8')

if (
  !license.includes('Apache License') ||
  !license.includes('Version 2.0, January 2004')
) {
  throw new Error('Unexpected PDF.js license payload; refusing to package it.')
}

await mkdir(outputDirectory, { recursive: true })
await copyFile(source, output)

console.log(`Copied PDF.js Apache-2.0 license to ${output}`)
