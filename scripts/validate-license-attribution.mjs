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
]

for (const fragment of requiredThirdPartyFragments) {
  if (!thirdParty.includes(fragment)) {
    failures.push(`third-party notice is missing provenance: ${fragment}`)
  }
}

if (failures.length > 0) {
  console.error('MedAtlas license/attribution contract FAILED')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(
  'MedAtlas license/attribution contract PASS: BodyParts3D CC BY 4.0 and Human Atlas MIT attribution remain visible and provenance remains documented.',
)
