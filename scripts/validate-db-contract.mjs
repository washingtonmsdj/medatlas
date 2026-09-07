import { readFile } from 'node:fs/promises'

const migrationPath =
  'supabase/migrations/202609070001_medatlas_core.sql'
const sql = await readFile(migrationPath, 'utf8')

const requiredTables = [
  'organizations',
  'organization_members',
  'professionals',
  'patients',
  'consultations',
  'visual_reports',
  'clinical_documents',
  'report_shares',
  'audit_events',
]

const failures = []

for (const table of requiredTables) {
  if (!sql.includes(`alter table public.${table} enable row level security;`)) {
    failures.push(`RLS missing for public.${table}`)
  }

  if (!sql.includes(`revoke all on table public.${table} from anon, authenticated;`)) {
    failures.push(`explicit grants reset missing for public.${table}`)
  }
}

const invariants = [
  ['pgcrypto extension', 'create extension if not exists pgcrypto'],
  ['hashed share token', "digest(raw_token, 'sha256')"],
  ['hashed token lookup', "token_hash = digest(p_token, 'sha256')"],
  ['no patient-id share URL', 'token_hash bytea not null unique'],
  ['share revocation', 'revoked_at timestamptz'],
  ['share expiry', 'expires_at timestamptz not null'],
  ['report publish gate', "status <> 'published'"],
  ['anatomy review gate', 'anatomy_review_required boolean not null default true'],
  ['explanation provenance', 'explanation_provenance jsonb not null'],
  ['approval identity', 'approved_by uuid references auth.users'],
  ['approval timestamp', 'approved_at timestamptz'],
  ['private document bucket', "'clinical-documents',\n  'clinical-documents',\n  false"],
  ['document digest', 'sha256_hex text not null'],
  ['audit log', 'create table if not exists public.audit_events'],
  ['public share RPC', 'medatlas_resolve_report_share'],
  ['tenant helper', 'medatlas_is_org_member'],
]

for (const [label, marker] of invariants) {
  if (!sql.includes(marker)) {
    failures.push(`Missing invariant: ${label}`)
  }
}

const tableDefinitions = [
  ...sql.matchAll(
    /create table if not exists\s+public\.[a-z0-9_]+\s*\([\s\S]*?\n\);/gi,
  ),
].map((match) => match[0])

if (
  tableDefinitions.some((definition) =>
    /\braw_token\s+(text|varchar)\b/i.test(definition),
  )
) {
  failures.push('A raw share token appears to be persisted as a table column')
}

if (/grant\s+all\s+on\s+table[\s\S]*?\bto\s+anon\b/i.test(sql)) {
  failures.push('Anonymous table-wide grant detected')
}

if (!sql.includes("grant execute on function public.medatlas_resolve_report_share(text)\n  to anon, authenticated;")) {
  failures.push('Anonymous access must be limited to the token resolver RPC')
}

if (failures.length > 0) {
  console.error('MedAtlas database contract FAILED')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log(
  `MedAtlas database contract PASS: ${requiredTables.length} RLS tables + secure patient share/storage invariants.`,
)
