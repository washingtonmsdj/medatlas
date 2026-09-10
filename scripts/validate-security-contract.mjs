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
const app = await read('src/App.tsx')
const reportIntake = await read('src/components/ReportIntake.tsx')
const productConstraints = await read('src/product/constraints.ts')
const indexHtml = await read('index.html')
const vercel = await read('vercel.json')
const envExample = await read('.env.example')

const requiredDemoFragments = [
  "syntheticOnly: true",
  "DEMO_CONSTRAINTS.shareTtlMinutes",
  "DEMO_CONSTRAINTS.viewDedupeMilliseconds",
  "DEMO_CONSTRAINTS.maxStoredShares",
  'clearDemoShares',
  'getStoredDemoShareCount',
  "const DEMO_SHARE_SCHEMA = 'medatlas.demo-share/1'",
  'expiresAt',
  'viewCount',
  'lastViewedAt',
  'getUsageSummary',
  'getReportViewStats',
  'pruneExpiredAndExcessShares',
  'const keys: string[] = []',
  'const activeShares = new Map<',
  '.slice(MAX_STORED_DEMO_SHARES)',
  'memoryShares.delete(token)',
  'entry.storageKey ?? \`${STORAGE_PREFIX}${token}\`',
  'const removedTokens = new Set(memoryShares.keys())',
  'removedTokens.add(key.slice(STORAGE_PREFIX.length))',
  'return removedTokens.size',
  'const storageKey = \`${STORAGE_PREFIX}${token}\`',
  'window.localStorage.setItem(storageKey, JSON.stringify(stored))',
  'Não foi possível criar um link temporário neste navegador.',
  '!Number.isInteger(parsed.report.version)',
  'parsed.report.version < 1',
  '!hasValidReviewPublicationBinding(parsed.report)',
  'const reportKey = \`${entry.report.id}:v${entry.report.version}\`',
  'reportVersion: stat.reportVersion',
  '!Number.isInteger(report.version)',
  '!report.reviewApproval',
  '!report.publicationIdentity',
  'hasValidReviewPublicationBinding(report)',
  'reviewApproval.organizationId === publicationIdentity.organizationId',
  'reviewApproval.workspaceId === publicationIdentity.workspaceId',
  'Number.isFinite(Date.parse(reviewApproval.approvedAt))',
  'Number.isFinite(Date.parse(publicationIdentity.publishedAt))',
]

for (const fragment of requiredDemoFragments) {
  if (!demoRepo.includes(fragment)) {
    failures.push(`demo repository missing safety invariant: ${fragment}`)
  }
}

if (demoRepo.includes('reportVersion: 1')) {
  failures.push(
    'demo analytics must use the persisted report version instead of a hardcoded version',
  )
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
  'DEMO_CONSTRAINTS.localText.maxBytes',
  'isDemoTextFilenameAllowed(file.name)',
  'validateDemoReportSource(text)',
  'validateDemoReportSource(nextValue)',
  'await file.text()',
  'Importar laudo sintético em TXT ou MD',
  'Texto acima do limite de',
]

for (const fragment of localImportInvariants) {
  if (!reportIntake.includes(fragment)) {
    failures.push(
      `local synthetic report import missing invariant: ${fragment}`,
    )
  }
}

const controllerSourceInvariants = [
  'validateDemoReportSource(value)',
  'validateDemoReportSource(example.sourceText)',
  'validateDemoReportSource(',
  'report.finding.sourceText,',
  'Texto acima do limite de',
]

for (const fragment of controllerSourceInvariants) {
  if (!app.includes(fragment)) {
    failures.push(
      `clinical report controller missing source boundary invariant: ${fragment}`,
    )
  }
}

const requiredConstraintFragments = [
  'minCharacters: 3',
  'maxBytes: 64 * 1024',
  "extensions: ['.txt', '.md'] as const",
  'new TextEncoder().encode(value).byteLength',
  'validateDemoReportSource',
  'isDemoTextFilenameAllowed',
  'shareTtlMinutes: 30',
  'maxStoredShares: 10',
  'viewDedupeMilliseconds: 1500',
]

for (const fragment of requiredConstraintFragments) {
  if (!productConstraints.includes(fragment)) {
    failures.push(
      `central product constraint missing safety invariant: ${fragment}`,
    )
  }
}

if (!demoRepo.includes("from '../product/constraints'")) {
  failures.push(
    'demo repository must source retention/security limits from the central product constraints',
  )
}

if (!reportIntake.includes("from '../product/constraints'")) {
  failures.push(
    'local report intake must source file limits from the central product constraints',
  )
}

if (!app.includes("from './product/constraints'")) {
  failures.push(
    'clinical report controller must source report text limits from the central product constraints',
  )
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
  'MedAtlas privacy/security MVP contract PASS: synthetic-only demo, bounded local report intake, versioned temporary shares, explicit review provenance, immutable publication identity, local anatomy runtime and deployment hardening verified.',
)
