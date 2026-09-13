import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'

const failures = []

async function collectSourceFiles(root) {
  const entries = await readdir(root, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const full = path.join(root, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await collectSourceFiles(full)))
      continue
    }

    if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      files.push(full)
    }
  }

  return files
}

const sourceFiles = await collectSourceFiles('src')
const runtimePath = path.normalize('src/organization/runtime.ts')

for (const file of sourceFiles) {
  const source = await readFile(file, 'utf8')

  if (
    path.normalize(file) !== runtimePath &&
    source.includes('demo-organization')
  ) {
    failures.push(
      `${file} bypasses organizationRuntime and imports demo organization data directly`,
    )
  }
}

const runtime = await readFile('src/organization/runtime.ts', 'utf8')
const types = await readFile('src/organization/types.ts', 'utf8')
const roles = await readFile('src/organization/roles.ts', 'utf8')
const demo = await readFile('src/organization/demo-organization.ts', 'utf8')
const demoIdentity = await readFile('src/demo/identity.ts', 'utf8')
const domainDemo = await readFile('src/domain/demo.ts', 'utf8')

for (const fragment of [
  "mode: 'demo'",
  'organization: DEMO_ORGANIZATION',
  'branding: DEMO_ORGANIZATION_BRANDING',
  'defaultWorkspaceId: DEFAULT_DEMO_WORKSPACE_ID',
  'getCurrentMember: getDemoCurrentMember',
  'getWorkspace: getDemoWorkspace',
  'getUnit: getDemoUnit',
]) {
  if (!runtime.includes(fragment)) {
    failures.push(`organization runtime missing boundary invariant: ${fragment}`)
  }
}

for (const fragment of [
  'export type OrganizationMemberRole',
  'export interface OrganizationMember',
  'export interface OrganizationUnit',
  'export interface ClinicalWorkspace',
  'export interface OrganizationBranding',
  'export interface OrganizationContext',
]) {
  if (!types.includes(fragment)) {
    failures.push(`organization types missing neutral contract: ${fragment}`)
  }
}

if (!roles.includes("from './types'")) {
  failures.push('organization roles must depend on neutral organization types')
}

if (!demo.includes("from './types'")) {
  failures.push('demo organization data must implement neutral organization types')
}

if (!demo.includes("from '../demo/identity'")) {
  failures.push('demo organization data must consume the canonical demo identity seed')
}

if (!domainDemo.includes("from '../demo/identity'")) {
  failures.push('demo report seed must consume the canonical demo identity seed')
}

for (const fragment of [
  'export const DEMO_ORGANIZATION_ID',
  'export const DEMO_ORGANIZATION_NAME',
  'export const DEMO_DEFAULT_WORKSPACE_ID',
  'export const DEMO_CURRENT_MEMBER',
  'export const DEMO_PATIENT',
]) {
  if (!demoIdentity.includes(fragment)) {
    failures.push(`canonical demo identity missing seed: ${fragment}`)
  }
}

for (const duplicateLiteral of [
  "'demo-org-clinica-horizonte'",
  "'demo-workspace-ortopedia'",
  "'demo-member-carlos'",
  "'pat_demo_001'",
  "'Paciente demonstração'",
  "'Dr. Carlos Mendes'",
]) {
  if (domainDemo.includes(duplicateLiteral)) {
    failures.push(
      `demo report seed duplicates canonical identity literal: ${duplicateLiteral}`,
    )
  }
}

if (demo.includes("from './roles'") || demo.includes('ROLE_LABELS')) {
  failures.push('demo organization data must not own or re-export generic role policy')
}

for (const unsafeFallback of [
  'DEMO_ORGANIZATION.members.find((member) => member.active)',
  'DEMO_ORGANIZATION.workspaces.find((workspace) => workspace.active)',
]) {
  if (demo.includes(unsafeFallback)) {
    failures.push(
      `demo organization selectors must fail closed instead of using fallback: ${unsafeFallback}`,
    )
  }
}

for (const requiredSelector of [
  'member.id === DEMO_CURRENT_MEMBER_ID && member.active',
  'workspace.id === workspaceId && workspace.active',
  'unit.id === unitId && unit.active',
]) {
  if (!demo.includes(requiredSelector)) {
    failures.push(
      `demo organization selector missing exact active match: ${requiredSelector}`,
    )
  }
}

for (const file of [
  'src/App.tsx',
  'src/components/TeamModule.tsx',
  'src/components/DemoSettings.tsx',
  'src/components/PatientReportPage.tsx',
]) {
  const source = await readFile(file, 'utf8')

  if (!source.includes('organizationRuntime')) {
    failures.push(`${file} must resolve organization state through organizationRuntime`)
  }
}

if (failures.length > 0) {
  console.error('MedAtlas organization runtime contract FAILED')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(
  'MedAtlas organization runtime contract PASS: UI is isolated from demo tenant data, canonical demo identity is shared by organization/report seeds, generic organization policy has neutral ownership, and explicit member/workspace/unit selectors fail closed.',
)
