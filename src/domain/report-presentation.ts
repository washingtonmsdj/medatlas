import type { VisualReport } from './types'

export type ReportWorkflowStepId =
  | 'source'
  | 'anatomy'
  | 'explanation'
  | 'share'

export type ReportWorkflowStepState = 'done' | 'current' | 'pending'

export interface ReportWorkflowStepPresentation {
  id: ReportWorkflowStepId
  label: string
  shortLabel: string
  detail: string
  done: boolean
  state: ReportWorkflowStepState
}

const STEP_META: Record<
  ReportWorkflowStepId,
  { label: string; shortLabel: string }
> = {
  source: {
    label: 'Importar laudo',
    shortLabel: 'Laudo',
  },
  anatomy: {
    label: 'Confirmar anatomia',
    shortLabel: 'Anatomia',
  },
  explanation: {
    label: 'Revisar explicação',
    shortLabel: 'Explicação',
  },
  share: {
    label: 'Publicar ao paciente',
    shortLabel: 'Paciente',
  },
}

function sourceDone(report: VisualReport) {
  return report.finding.sourceText.trim().length > 0
}

function anatomyDone(report: VisualReport) {
  return (
    Boolean(report.finding.atlasConceptId) &&
    !report.finding.anatomyReviewRequired
  )
}

function explanationDone(report: VisualReport) {
  return (
    anatomyDone(report) &&
    Boolean(report.finding.patientExplanation.trim()) &&
    !report.finding.explanationReviewRequired
  )
}

function shareDone(report: VisualReport) {
  return report.status === 'published' && Boolean(report.shareSlug)
}

export function deriveReportPresentation(report: VisualReport) {
  const completion: Record<ReportWorkflowStepId, boolean> = {
    source: sourceDone(report),
    anatomy: anatomyDone(report),
    explanation: explanationDone(report),
    share: shareDone(report),
  }

  const ids: ReportWorkflowStepId[] = [
    'source',
    'anatomy',
    'explanation',
    'share',
  ]
  const currentIndex = ids.findIndex((id) => !completion[id])

  const detailByStep: Record<ReportWorkflowStepId, string> = {
    source: completion.source
      ? `${report.finding.sourceText.trim().length.toLocaleString('pt-BR')} caracteres carregados`
      : 'Aguardando texto clínico',
    anatomy: completion.anatomy
      ? `${report.finding.anatomicalStructure} · ${report.finding.atlasConceptId}`
      : report.finding.atlasConceptId
        ? 'Reconfirmação necessária para o texto atual'
        : 'Nenhuma referência FMA confirmada',
    explanation: completion.explanation
      ? 'Texto revisado pelo profissional'
      : report.finding.patientExplanation.trim()
        ? 'Revisão profissional pendente'
        : 'Rascunho ainda não criado',
    share: completion.share
      ? 'Link temporário publicado'
      : 'Compartilhamento ainda não liberado',
  }

  const steps: ReportWorkflowStepPresentation[] = ids.map(
    (id, index) => ({
      id,
      ...STEP_META[id],
      detail: detailByStep[id],
      done: completion[id],
      state: completion[id]
        ? 'done'
        : index === currentIndex
          ? 'current'
          : 'pending',
    }),
  )

  const completed = steps.filter((step) => step.done).length
  const currentStep = steps.find((step) => step.state === 'current') ?? null

  const statusLabel = !completion.source
    ? 'Novo relatório'
    : !completion.anatomy
      ? report.finding.atlasConceptId
        ? 'Reconfirmar anatomia'
        : 'Confirmar anatomia'
      : !completion.explanation
        ? report.finding.patientExplanation.trim()
          ? 'Revisar explicação'
          : 'Criar explicação'
        : !completion.share
          ? 'Pronto para publicar'
          : 'Compartilhado'

  const anatomyLabel = report.finding.atlasConceptId
    ? report.finding.anatomicalStructure
    : 'Nenhuma estrutura confirmada'

  return {
    completion,
    steps,
    completed,
    total: steps.length,
    progressPercent: Math.round((completed / steps.length) * 100),
    currentStep,
    statusLabel,
    source: {
      state: completion.source ? 'ready' : 'empty',
      label: completion.source ? 'Texto carregado' : 'Aguardando texto',
      detail: detailByStep.source,
    },
    anatomy: {
      state: completion.anatomy
        ? 'confirmed'
        : report.finding.atlasConceptId
          ? 'review'
          : 'empty',
      label: anatomyLabel,
      detail: report.finding.atlasConceptId
        ? `${report.finding.atlasRef} · ${report.finding.atlasConceptId}`
        : `${report.finding.atlasRef} · sem FMA confirmado`,
    },
    explanation: {
      state: completion.explanation
        ? 'reviewed'
        : report.finding.patientExplanation.trim()
          ? 'review'
          : 'empty',
      label: completion.explanation
        ? 'Revisada'
        : report.finding.patientExplanation.trim()
          ? 'Revisão pendente'
          : 'Não criada',
      detail: report.finding.patientExplanation.trim()
        ? `${report.finding.patientExplanation.length.toLocaleString('pt-BR')} caracteres`
        : 'Aguardando conteúdo',
    },
    sharing: {
      state: completion.share ? 'published' : 'draft',
      label: completion.share ? 'Compartilhado' : 'Não publicado',
      detail: completion.share
        ? 'Link temporário ativo'
        : completion.explanation
          ? 'Gate clínico concluído'
          : 'Gate humano preservado',
    },
  }
}
