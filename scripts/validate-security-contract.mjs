import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'

const failures = []

async function read(file) {
  return readFile(file, 'utf8')
}

async function collectTextFiles(root) {
  const entries = await readdir(root, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const full = path.join(root, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await collectTextFiles(full)))
      continue
    }

    if (
      entry.isFile() &&
      /\.(ts|tsx|js|jsx|json|html|css|md)$/.test(entry.name)
    ) {
      files.push(full)
    }
  }

  return files
}

const demoRepo = await read('src/data/demo-clinical-repository.ts')
const reportIntake = await read('src/components/ReportIntake.tsx')
const indexHtml = await read('index.html')
const vercel = await read('vercel.json')
const envExample = await read('.env.example')

const requiredDemoFragments = [
  "syntheticOnly: true",
  "const DEMO_SHARE_TTL_MS = 30 * 60 * 1000",
  "const DEMO_VIEW_DEDUPE_MS = 1500",
  "const MAX_STORED_DEMO_SHARES = 10",
  'clearDemoShares',
  'getStoredDemoShareCount',
  "const DEMO_SHARE_SCHEMA = 'medatlas.demo-share/1'",
  'expiresAt',
  'viewCount',
  'lastViewedAt',
  'getUsageSummary',
  'getReportViewStats',
  'pruneExpiredAndExcessShares',
]

for (const fragment of requiredDemoFragments) {
  if (!demoRepo.includes(fragment)) {
    failures.push(`demo repository missing safety invariant: ${fragment}`)
  }
}

if (!demoRepo.includes('crypto.getRandomValues')) {
  failures.push('demo share token is not cryptographically generated')
}

if (!demoRepo.includes('/^[0-9a-f]{64}$/')) {
  failures.push('demo patient token format is not fail-closed')
}

if (
  /\bfetch\s*\(|navigator\.sendBeacon|new\s+XMLHttpRequest/i.test(
    demoRepo,
  )
) {
  failures.push(
    'demo repository must not send share analytics to external telemetry',
  )
}

const localImportInvariants = [
  'const MAX_LOCAL_TEXT_BYTES = 64 * 1024',
  "const ALLOWED_TEXT_EXTENSIONS = ['.txt', '.md']",
  'await file.text()',
  'Importar laudo de texto sintético',
]

for (const fragment of localImportInvariants) {
  if (!reportIntake.includes(fragment)) {
    failures.push(
      `local synthetic report import missing invariant: ${fragment}`,
    )
  }
}

const requiredMetaCsp = [
  "default-src 'self'",
  "script-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
]

for (const directive of requiredMetaCsp) {
  if (!indexHtml.includes(directive)) {
    failures.push(`index CSP missing directive: ${directive}`)
  }
}

const requiredHeaders = [
  'Content-Security-Policy',
  "frame-ancestors 'none'",
  'X-Content-Type-Options',
  'nosniff',
  'Referrer-Policy',
  'no-referrer',
  'Permissions-Policy',
  'camera=(), microphone=(), geolocation=(), payment=()',
  'Cross-Origin-Opener-Policy',
  'Cross-Origin-Resource-Policy',
]

for (const header of requiredHeaders) {
  if (!vercel.includes(header)) {
    failures.push(`Vercel security headers missing: ${header}`)
  }
}

const runtimeFiles = [
  ...(await collectTextFiles('src')),
  'vite.config.ts',
  'vercel.json',
  'index.html',
]

for (const file of runtimeFiles) {
  const content = await read(file)

  if (
    content.includes('raw.githubusercontent.com') ||
    content.includes('ashemag/human-atlas/')
  ) {
    failures.push(
      `runtime file ${file} reintroduces a remote Human Atlas dependency`,
    )
  }
}

const envLines = envExample
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => /^VITE_[A-Z0-9_]+=/.test(line))

for (const line of envLines) {
  const [, value = ''] = line.split('=', 2)
  if (value.trim()) {
    failures.push(
      `.env.example contains a non-empty public runtime credential/value: ${line.split('=')[0]}`,
    )
  }
}

if (failures.length > 0) {
  console.error('MedAtlas privacy/security MVP contract FAILED')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log(
  'MedAtlas privacy/security MVP contract PASS: synthetic-only demo, temporary shares, local anatomy runtime and deployment hardening verified.',
)
