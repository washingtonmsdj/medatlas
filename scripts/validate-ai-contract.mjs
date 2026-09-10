import { readFile } from 'node:fs/promises'

const schema = JSON.parse(
  await readFile(
    'src/clinical/structured-extraction.schema.json',
    'utf8',
  ),
)
const source = await readFile(
  'src/clinical/structured-extraction.ts',
  'utf8',
)
const constraintsSource = await readFile(
  'src/product/constraints.ts',
  'utf8',
)
const manifest = JSON.parse(
  await readFile(
    'third_party/human-atlas/CURATED_CONCEPTS.json',
    'utf8',
  ),
)

const failures = []

if (schema.$id !== 'medatlas.clinical-extraction/1') {
  failures.push(`unexpected AI schema id: ${schema.$id}`)
}

if (schema.additionalProperties !== false) {
  failures.push('top-level AI schema must reject unknown properties')
}

if (
  schema.properties?.requiresClinicianReview?.const !== true
) {
  failures.push(
    'AI schema must require requiresClinicianReview=true',
  )
}

const candidates = schema.properties?.candidateStructures
if (
  candidates?.minItems !== 1 ||
  candidates?.maxItems !== 6
) {
  failures.push(
    'AI schema candidateStructures must be constrained to 1..6',
  )
}

if (
  candidates?.items?.additionalProperties !== false ||
  candidates?.items?.properties?.conceptId?.pattern !==
    '^FMA[0-9]+$'
) {
  failures.push(
    'AI anatomy candidates must be strict FMA concept objects',
  )
}

const confidence =
  candidates?.items?.properties?.confidence

if (
  confidence?.minimum !== 0 ||
  confidence?.maximum !== 1
) {
  failures.push('AI confidence must be constrained to 0..1')
}

if (schema.properties?.patientExplanationDraft?.maxLength !== 4000) {
  failures.push(
    'AI patient explanation draft must stay bounded to the product maximum of 4000 characters',
  )
}

const forbiddenTerms = [
  'diagnosis',
  'diagnóstico',
  'treatmentRecommendation',
  'treatment',
  'prescription',
  'prescrição',
  'autonomousPublish',
]

const schemaText = JSON.stringify(schema)

for (const term of forbiddenTerms) {
  if (schemaText.toLowerCase().includes(term.toLowerCase())) {
    failures.push(
      `AI schema contains forbidden autonomous clinical field/term: ${term}`,
    )
  }
}

const requiredSourceFragments = [
  'validateStructuredClinicalExtraction',
  'concept.elements.length < 1',
  'requiresClinicianReview !== true',
  'A IA retornou',
  'DisabledClinicalExtractionEngine',
  "readonly mode = 'disabled' as const",
  'DEMO_CONSTRAINTS.patientExplanation.maxCharacters',
  'patientExplanationCharacterLength',
  'anatomySuggestionSourceToken',
  'sourceText: string',
  'sourceToken,',
]

for (const fragment of requiredSourceFragments) {
  if (!source.includes(fragment)) {
    failures.push(
      `runtime AI validator missing invariant: ${fragment}`,
    )
  }
}

const requiredConstraintFragments = [
  'patientExplanation:',
  'maxCharacters: 4000',
  'patientExplanationCharacterLength',
  'validateDemoPatientExplanation',
]

for (const fragment of requiredConstraintFragments) {
  if (!constraintsSource.includes(fragment)) {
    failures.push(
      `central product constraints missing AI explanation invariant: ${fragment}`,
    )
  }
}

if (manifest.concepts.length < 1) {
  failures.push('curated anatomy manifest unexpectedly empty')
}

for (const concept of manifest.concepts) {
  if (
    !/^FMA\d+$/.test(concept.id) ||
    !Number.isInteger(concept.elements) ||
    concept.elements < 1
  ) {
    failures.push(
      `curated concept is not renderable/valid: ${concept.id}`,
    )
  }
}

if (failures.length > 0) {
  console.error('MedAtlas AI safety contract FAILED')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log(
  `MedAtlas AI safety contract PASS: strict schema, mandatory clinician review, bounded source-bound explanations, disabled provider and ${manifest.concepts.length} curated renderable concepts verified.`,
)
