import { readFile } from 'node:fs/promises'

const notice = await readFile(
  'src/components/AttributionNotice.tsx',
  'utf8',
)
const settings = await readFile(
  'src/components/DemoSettings.tsx',
  'utf8',
)
const patient = await readFile(
  'src/components/PatientReportPage.tsx',
  'utf8',
)
const thirdParty = await readFile(
  'THIRD_PARTY_NOTICES.md',
  'utf8',
)
const packageJson = JSON.parse(await readFile('package.json', 'utf8'))
const packageLock = JSON.parse(await readFile('package-lock.json', 'utf8'))
const pdfLicense = await readFile('node_modules/pdfjs-dist/LICENSE', 'utf8')
const licensePackaging = await readFile(
  'scripts/copy-third-party-licenses.mjs',
  'utf8',
)

const failures = []

const requiredNoticeFragments = [
  'BodyParts3D, © The Database Center for Life Science licensed under CC',
  'Attribution 4.0 International',
  'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html',
  'https://creativecommons.org/licenses/by/4.0/',
  'https://github.com/ashemag/human-atlas',
  'Human Atlas',
  'MIT',
  'anatomia humana de referência',
]

for (const fragment of requiredNoticeFragments) {
  if (!notice.includes(fragment)) {
    failures.push(`visible attribution is missing: ${fragment}`)
  }
}

if (!settings.includes('<AttributionNotice />')) {
  failures.push('clinician settings do not render the attribution notice')
}

if (!patient.includes('<AttributionNotice compact />')) {
  failures.push('patient report does not render the attribution notice')
}

const requiredThirdPartyFragments = [
  'BodyParts3D 4.0',
  'CC Attribution 4.0 International',
  'third_party/human-atlas/LICENSE',
  '1c38bf35c254a891200d3cedecfd57abebe83d8d',
  '## PDF.js',
  'https://github.com/mozilla/pdf.js',
  'pdfjs-dist@6.3.289',
  'Apache License 2.0',
  'node_modules/pdfjs-dist/LICENSE',
  'dist/licenses/pdfjs-LICENSE.txt',
]

for (const fragment of requiredThirdPartyFragments) {
  if (!thirdParty.includes(fragment)) {
    failures.push(`third-party notice is missing provenance: ${fragment}`)
  }
}

if (packageJson.dependencies?.['pdfjs-dist'] !== '6.3.289') {
  failures.push('package.json must pin pdfjs-dist exactly to 6.3.289')
}

if (packageLock.packages?.['node_modules/pdfjs-dist']?.version !== '6.3.289') {
  failures.push('package-lock.json must resolve pdfjs-dist exactly to 6.3.289')
}

if (
  !pdfLicense.includes('Apache License') ||
  !pdfLicense.includes('Version 2.0, January 2004')
) {
  failures.push('installed PDF.js package does not contain the expected Apache-2.0 license')
}

for (const fragment of [
  "const source = 'node_modules/pdfjs-dist/LICENSE'",
  "const outputDirectory = 'dist/licenses'",
  "'pdfjs-LICENSE.txt'",
  'copyFile(source, output)',
]) {
  if (!licensePackaging.includes(fragment)) {
    failures.push(`PDF.js license packaging is missing: ${fragment}`)
  }
}

if (failures.length > 0) {
  console.error('MedAtlas license/attribution contract FAILED')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(
  'MedAtlas license/attribution contract PASS: BodyParts3D CC BY 4.0, Human Atlas MIT and PDF.js Apache-2.0 provenance/license distribution remain protected.',
)
