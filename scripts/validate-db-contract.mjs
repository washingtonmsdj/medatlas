import { readdir, readFile } from 'node:fs/promises'

const migrationsDir = 'supabase/migrations'
const migrationNames = (await readdir(migrationsDir))
  .filter((name) => name.endsWith('.sql'))
  .sort()

if (migrationNames.length === 0) {
  throw new Error('No Supabase migrations found')
}

const migrationSources = await Promise.all(
  migrationNames.map(async (name) => ({
    name,
    sql: await readFile(`${migrationsDir}/${name}`, 'utf8'),
  })),
)

const sql = migrationSources
  .map(({ name, sql: source }) => `-- ${name}\n${source}`)
  .join('\n\n')

const requiredTables = [
  'organizations',
  'organization_members',
  'organization_invitations',
  'professionals',
  'organization_units',
  'clinical_workspaces',
  'organization_branding',
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
  [
    'anatomy review gate',
    'anatomy_review_required boolean not null default true',
  ],
  ['explanation provenance', 'explanation_provenance jsonb not null'],
  ['approval identity', 'approved_by uuid references auth.users'],
  ['approval timestamp', 'approved_at timestamptz'],
  [
    'private document bucket',
    "'clinical-documents',\n  'clinical-documents',\n  false",
  ],
  ['document digest', 'sha256_hex text not null'],
  ['audit log', 'create table if not exists public.audit_events'],
  ['public share RPC', 'medatlas_resolve_report_share'],
  ['tenant helper', 'medatlas_is_org_member'],
  ['organization admin helper', 'medatlas_is_org_admin'],
  [
    'organization units',
    'create table if not exists public.organization_units',
  ],
  [
    'clinical workspaces',
    'create table if not exists public.clinical_workspaces',
  ],
  [
    'workspace tenant-safe unit FK',
    'foreign key (unit_id, organization_id)\n    references public.organization_units(id, organization_id)',
  ],
  [
    'workspace admin write policy',
    'create policy clinical_workspaces_admin_write',
  ],
  [
    'unit admin write policy',
    'create policy organization_units_admin_write',
  ],
  [
    'organization branding',
    'create table if not exists public.organization_branding',
  ],
  [
    'branding admin write policy',
    'create policy organization_branding_admin_write',
  ],
  [
    'branding color field',
    "primary_color_hex text not null default '#1769AA'",
  ],
  [
    'usage summary RPC',
    'create or replace function public.medatlas_get_usage_summary',
  ],
  [
    'report view stats RPC',
    'create or replace function public.medatlas_get_report_view_stats',
  ],
  [
    'analytics membership gate',
    'if not public.medatlas_is_org_member(p_organization_id) then',
  ],
  [
    'analytics from audit views',
    "event.event_type = 'report.share_viewed'",
  ],
  [
    'organization invitations',
    'create table if not exists public.organization_invitations',
  ],
  [
    'invitation raw token hashed',
    "digest(raw_token, 'sha256')",
  ],
  [
    'invitation hashed token lookup',
    "candidate.token_hash = digest(p_token, 'sha256')",
  ],
  [
    'invitation admin create gate',
    'if not public.medatlas_is_org_admin(p_organization_id) then',
  ],
  [
    'invitation authenticated email match',
    "current_email <> invitation.email",
  ],
  [
    'invitation inactive membership lock',
    'select membership.active\n  into existing_member_active',
  ],
  [
    'invitation membership reactivation',
    'set\n      role = invitation.role,\n      active = true',
  ],
  [
    'invitation atomic membership upsert',
    'on conflict (organization_id, user_id)\n  do update',
  ],
  [
    'invitation does not overwrite active member',
    'where public.organization_members.active = false',
  ],
  [
    'invitation upsert result gate',
    'returning true into membership_upserted',
  ],
  [
    'invitation active member race rejection',
    'if not coalesce(membership_upserted, false) then',
  ],
  [
    'invitation admin read policy',
    'create policy organization_invitations_admin_select',
  ],
  [
    'invitation create RPC',
    'create or replace function public.medatlas_create_organization_invitation',
  ],
  [
    'invitation accept RPC',
    'create or replace function public.medatlas_accept_organization_invitation',
  ],
  [
    'invitation revoke RPC',
    'create or replace function public.medatlas_revoke_organization_invitation',
  ],
  [
    'invitation audit create',
    "'organization.invitation_created'",
  ],
  [
    'invitation audit accept',
    "'organization.invitation_accepted'",
  ],
  [
    'invitation audit revoke',
    "'organization.invitation_revoked'",
  ],
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
  failures.push('A raw share/invitation token appears to be persisted as a table column')
}

if (/grant\s+all\s+on\s+table[\s\S]*?\bto\s+anon\b/i.test(sql)) {
  failures.push('Anonymous table-wide grant detected')
}

if (
  !sql.includes(
    "grant execute on function public.medatlas_resolve_report_share(text)\n  to anon, authenticated;",
  )
) {
  failures.push('Anonymous access must be limited to the token resolver RPC')
}

if (
  /grant execute on function public\.medatlas_(create|accept|revoke)_organization_invitation[\s\S]*?\bto\s+anon\b/i.test(sql)
) {
  failures.push('Organization invitation mutation RPC exposed to anon')
}

if (failures.length > 0) {
  console.error('MedAtlas database contract FAILED')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log(
  `MedAtlas database contract PASS: ${requiredTables.length} RLS tables across ${migrationNames.length} migration(s) + tenant-safe organization/workspace/branding/invitation/share/storage invariants.`,
)
