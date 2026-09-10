import { useEffect, useReducer, useState } from 'react'
import type { AtlasConcept } from './atlas/types'
import {
  conceptDisplayName,
  loadHumanAtlas,
} from './atlas/source'
import {
  suggestAnatomyFromText,
  type AnatomySuggestion,
} from './clinical/anatomy-suggestions'
import { patientExplanationGenerator } from './clinical/patient-explanation'
import { AtlasViewport } from './components/AtlasViewport'
import { AnalyticsModule } from './components/AnalyticsModule'
import { DemoPrivacyBanner } from './components/DemoPrivacyBanner'
import { DemoSettings } from './components/DemoSettings'
import {
  CLINICAL_NAV_ITEMS,
  ClinicalSidebar,
  type ClinicalModuleName,
} from './components/ClinicalSidebar'
import { TeamModule } from './components/TeamModule'
import { PatientsModule } from './components/PatientsModule'
import { Overview } from './components/Overview'
import {
  InvalidPatientLink,
  PatientReportPage,
} from './components/PatientReportPage'
import { ReportComposer } from './components/ReportComposer'
import { ReferenceAtlasExplorer } from './components/ReferenceAtlasExplorer'
import { GlobalCommandSearch, type GlobalSearchAction } from './components/GlobalCommandSearch'
import { TopbarUtilityActions } from './components/TopbarUtilityActions'
import { WorkspacePageHeader } from './components/WorkspacePageHeader'
import { REPORT_EXAMPLES, type ReportExample } from './clinical/demo-scenarios'
import { ReportIntake } from './components/ReportIntake'
import { getClinicalRepository } from './data/repository'
import { createEmptyDemoReport, demoReport } from './domain/demo'
import { reportWorkflowReducer } from './domain/report-workflow'
import { deriveReportPresentation } from './domain/report-presentation'
import type { VisualReport } from './domain/types'
import { ROLE_LABELS } from './organization/roles'
import { organizationRuntime } from './organization/runtime'

type ModuleName = ClinicalModuleName

const moduleMeta: Record<ModuleName, { title: string }> = {
  'Visão geral': { title: 'Início' },
  'Atlas 3D': { title: 'Atlas 3D' },
  Pacientes: { title: 'Paciente atual' },
  'Relatórios visuais': { title: 'Relatório visual' },
  Equipe: { title: 'Equipe' },
  Analytics: { title: 'Analytics' },
  Configurações: { title: 'Configurações' },
}

const clinicalData = getClinicalRepository()

function PatientRoute({ slug }: { slug: string }) {
  const [state, setState] = useState<
    | { status: 'loading' }
    | { status: 'missing' }
    | { status: 'ready'; report: VisualReport }
  >({ status: 'loading' })

  useEffect(() => {
    let active = true

    void clinicalData.repository
      .resolvePatientShare(slug)
      .then((report) => {
        if (!active) return
        setState(
          report
            ? { status: 'ready', report }
            : { status: 'missing' },
        )
      })
      .catch(() => {
        if (active) setState({ status: 'missing' })
      })

    return () => {
      active = false
    }
  }, [slug])

  if (state.status === 'loading') {
    return (
      <main
        className="patient-route-state patient-route-loading"
        aria-busy="true"
        aria-live="polite"
      >
        <div className="patient-route-state-card">
          <div className="brand">
            <span className="brand-mark">M</span>
            <span>MedAtlas</span>
          </div>

          <div className="patient-route-state-visual" aria-hidden="true">
            <span className="patient-route-spinner" />
            <i />
            <i />
            <i />
          </div>

          <span className="section-kicker">RELATÓRIO DO PACIENTE</span>
          <h1>Abrindo relatório…</h1>
          <p>Validando o link e preparando a visualização 3D.</p>
        </div>
      </main>
    )
  }

  return state.status === 'ready' ? (
    <PatientReportPage report={state.report} />
  ) : (
    <InvalidPatientLink />
  )
}

function ClinicianApp() {
  const [report, dispatchReport] = useReducer(
    reportWorkflowReducer,
    demoReport,
  )
  const [active, setActive] = useState<ModuleName>('Visão geral')
  const [viewMode, setViewMode] = useState<'professional' | 'patient'>('professional')
  const [activeWorkspaceId] = useState(organizationRuntime.defaultWorkspaceId)
  const [publishing, setPublishing] = useState(false)
  const [generatingDraft, setGeneratingDraft] = useState(false)
  const [publishError, setPublishError] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [intakeError, setIntakeError] = useState('')
  const [suggestions, setSuggestions] = useState<AnatomySuggestion[]>([])

  const startNewReport = () => {
    dispatchReport({
      type: 'replace',
      report: createEmptyDemoReport(),
    })
    setSuggestions([])
    setIntakeError('')
    setPublishError('')
    setPublishing(false)
    setGeneratingDraft(false)
    setActive('Relatórios visuais')
  }

  const publish = async () => {
    if (
      report.finding.anatomyReviewRequired ||
      report.finding.explanationReviewRequired ||
      publishing ||
      !report.finding.patientExplanation.trim()
    ) {
      return
    }

    setPublishing(true)
    setPublishError('')

    try {
      const published =
        await clinicalData.repository.publishReport(report)
      dispatchReport({
        type: 'published',
        report: published,
      })
    } catch (error) {
      setPublishError(
        error instanceof Error
          ? error.message
          : 'Não foi possível publicar o relatório.',
      )
    } finally {
      setPublishing(false)
    }
  }

  const confirmConcept = (concept: AtlasConcept) => {
    const displayName = conceptDisplayName(concept)

    dispatchReport({
      type: 'anatomy-confirmed',
      conceptId: concept.id,
      displayName,
    })
    setSuggestions([])
    setPublishError('')
    setIntakeError('')
  }

  const updateSourceText = (value: string) => {
    dispatchReport({
      type: 'source-text-changed',
      value,
    })

    setSuggestions([])
    setIntakeError('')
    setPublishError('')
  }

  const loadExample = (example: ReportExample) => {
    dispatchReport({
      type: 'example-loaded',
      example,
    })

    setSuggestions([])
    setIntakeError('')
    setPublishError('')
    setActive('Relatórios visuais')
  }

  const analyzeSourceText = async () => {
    const sourceText = report.finding.sourceText.trim()

    if (sourceText.length < 3 || analyzing) return

    setAnalyzing(true)
    setIntakeError('')

    try {
      const atlas = await loadHumanAtlas()
      const nextSuggestions = suggestAnatomyFromText(
        atlas,
        sourceText,
      )

      setSuggestions(nextSuggestions)

      if (nextSuggestions.length === 0) {
        setIntakeError(
          'Nenhuma correspondência segura foi encontrada. Use a busca do atlas para escolher a estrutura manualmente.',
        )
      }
    } catch (error) {
      setIntakeError(
        error instanceof Error
          ? error.message
          : 'Não foi possível analisar as referências anatômicas.',
      )
    } finally {
      setAnalyzing(false)
    }
  }

  const generateExplanationDraft = async () => {
    if (generatingDraft) return

    setGeneratingDraft(true)
    setPublishError('')

    try {
      const generated =
        await patientExplanationGenerator.generate(report)

      dispatchReport({
        type: 'draft-generated',
        draft: generated,
      })
    } catch (error) {
      setPublishError(
        error instanceof Error
          ? error.message
          : 'Não foi possível gerar o rascunho educacional.',
      )
    } finally {
      setGeneratingDraft(false)
    }
  }

  const updateExplanation = (value: string) => {
    if (report.finding.anatomyReviewRequired) return

    dispatchReport({
      type: 'explanation-edited',
      value,
    })
    setPublishError('')
  }

  const approveExplanation = () => {
    if (
      report.finding.anatomyReviewRequired ||
      !report.finding.patientExplanation.trim()
    ) {
      return
    }

    dispatchReport({ type: 'explanation-approved' })
    setPublishError('')
  }

  const clearShareState = () => {
    dispatchReport({ type: 'shares-cleared' })
    setPublishError('')
  }

  const reportPresentation = deriveReportPresentation(report)

  const reportWorkflow = (
    <section className="workspace-page">
      <WorkspacePageHeader
        eyebrow="RELATÓRIO VISUAL"
        title={report.title}
        description={`${report.patient.displayName} · ${reportPresentation.statusLabel}`}
        meta={
          <span
            className={
              reportPresentation.completion.share
                ? 'report-state-chip published'
                : 'report-state-chip'
            }
          >
            {reportPresentation.completed}/{reportPresentation.total} etapas
          </span>
        }
        actions={
          <button type="button" onClick={() => setViewMode('patient')}>
            Prévia do paciente
          </button>
        }
      />

      <section className="workflow-strip report-workflow-strip" aria-label="Fluxo do relatório">
        {reportPresentation.steps.map((step, index) => (
          <div
            className={step.state}
            data-step-state={step.state}
            key={step.id}
          >
            <span>{step.done ? '✓' : index + 1}</span>
            <p>{step.label}</p>
            {step.state === 'current' && <small>Em andamento</small>}
          </div>
        ))}
      </section>

      <section className="clinical-report-studio" data-surface-priority="desktop-first">
        <div className="report-source-column studio-panel">
          <div className="studio-panel-label">
            <span>01</span>
            <div>
              <strong>Laudo / exame</strong>
              <small>Adicione o texto e localize a anatomia</small>
            </div>
          </div>

          <ReportIntake
            sourceText={report.finding.sourceText}
            analyzing={analyzing}
            anatomyReviewRequired={report.finding.anatomyReviewRequired}
            error={intakeError}
            suggestions={suggestions}
            onSourceTextChange={updateSourceText}
            onLoadExample={loadExample}
            onAnalyze={analyzeSourceText}
            onConfirmSuggestion={(suggestion) =>
              confirmConcept(suggestion.concept)
            }
          />
        </div>

        <div className="report-atlas-column studio-panel">
          <div className="studio-panel-label">
            <span>02</span>
            <div>
              <strong>Anatomia 3D</strong>
              <small>Confirme a estrutura usada no relatório</small>
            </div>
            <button type="button" onClick={() => setActive('Atlas 3D')}>
              Abrir Atlas completo
            </button>
          </div>

          <section
            className={
              'finding-card finding-card-studio ' +
              (!report.finding.atlasConceptId
                ? 'anatomy-empty'
                : report.finding.anatomyReviewRequired
                  ? 'anatomy-review'
                  : 'anatomy-confirmed')
            }
          >
            <div>
              <div className="finding-state-line">
                <span
                  className="finding-state-icon"
                  aria-hidden="true"
                >
                  {!report.finding.atlasConceptId
                    ? '○'
                    : report.finding.anatomyReviewRequired
                      ? '!'
                      : '✓'}
                </span>
                <span className="section-kicker">
                  {!report.finding.atlasConceptId
                    ? 'ANATOMIA A CONFIRMAR'
                    : report.finding.anatomyReviewRequired
                      ? 'RECONFIRMAÇÃO NECESSÁRIA'
                      : 'ANATOMIA CONFIRMADA'}
                </span>
              </div>
              <h2>{report.finding.anatomicalStructure}</h2>
              <p>
                {!report.finding.atlasConceptId
                  ? 'Analise o texto ou use a busca do Atlas para escolher a estrutura.'
                  : report.finding.anatomyReviewRequired
                    ? 'O texto mudou. Confirme novamente a estrutura antes de continuar.'
                    : 'Estrutura confirmada para esta versão do relatório.'}
              </p>
            </div>

            <div className="finding-match">
              <span>Referência</span>
              <strong>
                {!report.finding.atlasConceptId
                  ? 'Aguardando seleção'
                  : report.finding.anatomyReviewRequired
                    ? 'Revisar seleção'
                    : 'Confirmada'}
              </strong>
              <small>
                {report.finding.atlasConceptId
                  ? 'Human Atlas 3D'
                  : 'Selecione uma estrutura no Atlas'}
              </small>
            </div>
          </section>

          <AtlasViewport
            selected={report.finding.anatomicalStructure}
            conceptId={report.finding.atlasConceptId}
            onConfirmConcept={confirmConcept}
          />
        </div>

        <div className="report-explanation-column studio-panel">
          <div className="studio-panel-label">
            <span>03</span>
            <div>
              <strong>Explicação ao paciente</strong>
              <small>Edite, revise e compartilhe</small>
            </div>
          </div>

          <ReportComposer
            report={report}
            publishing={publishing}
            generatingDraft={generatingDraft}
            publishError={publishError}
            onPublish={publish}
            onGenerateDraft={generateExplanationDraft}
            onUpdateExplanation={updateExplanation}
            onApproveExplanation={approveExplanation}
            onPreviewPatient={() => setViewMode('patient')}
          />
        </div>
      </section>
    </section>
  )

  const renderModule = () => {
    switch (active) {
      case 'Visão geral':
        return (
          <Overview
            report={report}
            organizationName={organizationRuntime.organization.name}
            workspaceName={activeWorkspace?.name ?? 'Workspace clínico'}
            unitName={activeUnit?.name}
            professionalDisplayName={
              currentMember?.displayName ?? 'Profissional demo'
            }
            onNewReport={startNewReport}
            onOpenReport={() => setActive('Relatórios visuais')}
            onOpenAtlas={() => setActive('Atlas 3D')}
          />
        )

      case 'Atlas 3D':
        return (
          <ReferenceAtlasExplorer
            initialConceptId={
              report.finding.atlasConceptId || undefined
            }
            report={report}
            onConfirmConcept={confirmConcept}
            onOpenReport={() => setActive('Relatórios visuais')}
            onOpenPatientPreview={() => setViewMode('patient')}
          />
        )

      case 'Relatórios visuais':
        return reportWorkflow

      case 'Pacientes':
        return (
          <PatientsModule
            report={report}
            onOpenReport={() => setActive('Relatórios visuais')}
            onOpenAtlas={() => setActive('Atlas 3D')}
          />
        )

      case 'Equipe':
        return <TeamModule />

      case 'Analytics':
        return <AnalyticsModule repository={clinicalData.repository} />

      case 'Configurações':
        return (
          <DemoSettings
            onNewReport={startNewReport}
            onSharesCleared={clearShareState}
          />
        )
    }
  }

  const activeWorkspace = organizationRuntime.getWorkspace(activeWorkspaceId)
  const activeUnit = organizationRuntime.getUnit(activeWorkspace?.unitId)
  const currentMember = organizationRuntime.getCurrentMember()

  const globalSearchActions: GlobalSearchAction[] = [
    {
      id: 'action-new-report',
      label: 'Novo relatório',
      description: 'Criar um relatório vazio.',
      group: 'Ação',
      keywords: 'novo laudo exame criar atendimento',
      onSelect: startNewReport,
    },
    {
      id: 'action-current-report',
      label: 'Continuar relatório atual',
      description: report.title,
      group: 'Ação',
      keywords: report.finding.anatomicalStructure,
      onSelect: () => setActive('Relatórios visuais'),
    },
    {
      id: 'action-open-atlas',
      label: 'Abrir Atlas 3D',
      description: 'Abrir o Human Atlas completo.',
      group: 'Ação',
      keywords: 'anatomia corpo fma human atlas',
      onSelect: () => setActive('Atlas 3D'),
    },
    {
      id: 'patient-demo',
      label: report.patient.displayName,
      description: 'Abrir o paciente atual.',
      group: 'Paciente',
      keywords: report.title,
      onSelect: () => setActive('Pacientes'),
    },
    ...CLINICAL_NAV_ITEMS.map((item) => ({
      id: 'module-' + item,
      label: item,
      description: moduleMeta[item].title,
      group: 'Módulo' as const,
      keywords: item,
      onSelect: () => setActive(item),
    })),
    ...REPORT_EXAMPLES.map((example) => ({
      id: 'scenario-' + example.id,
      label: example.label,
      description: example.title,
      group: 'Cenário' as const,
      keywords: example.sourceText,
      onSelect: () => loadExample(example),
    })),
  ]

  if (viewMode === 'patient') {
    return (
      <PatientReportPage
        report={report}
        previewMode
        onSwitchToProfessional={() => setViewMode('professional')}
      />
    )
  }

  return (
    <div className="app-shell clinical-app-shell">
      <a className="skip-link" href="#clinical-workspace">
        Ir para o conteúdo principal
      </a>
      <ClinicalSidebar
        active={active}
        organizationName={organizationRuntime.organization.name}
        workspaceName={activeWorkspace?.name ?? 'Workspace clínico'}
        unitName={activeUnit?.name}
        onNavigate={setActive}
      />

      <main className="workspace clinical-workspace" id="clinical-workspace" tabIndex={-1}>
        <header className="clinical-topbar">
          <GlobalCommandSearch actions={globalSearchActions} />

          <TopbarUtilityActions
            report={report}
            memberName={
              currentMember?.displayName ?? 'Profissional demo'
            }
            initials={currentMember?.initials ?? 'MD'}
            specialty={
              currentMember?.professional?.specialty ??
              'Workspace clínico'
            }
            roleLabel={
              currentMember
                ? ROLE_LABELS[currentMember.role]
                : 'Profissional demonstrativo'
            }
            workspaceName={
              activeWorkspace?.name ?? 'Workspace clínico'
            }
            onOpenReports={() => setActive('Relatórios visuais')}
            onOpenAtlas={() => setActive('Atlas 3D')}
            onOpenTeam={() => setActive('Equipe')}
            onOpenSettings={() => setActive('Configurações')}
            onOpenPatientPreview={() => setViewMode('patient')}
          />
        </header>

        <div className="demo-privacy-boundary">
          <DemoPrivacyBanner />
        </div>

        {renderModule()}
      </main>
    </div>
  )
}

function App() {
  const querySlug = new URLSearchParams(window.location.search).get('patient')
  const patientMatch = window.location.pathname.match(/^\/p\/([^/]+)\/?$/)
  const patientSlug = querySlug ?? patientMatch?.[1] ?? null

  if (patientSlug) {
    return <PatientRoute slug={decodeURIComponent(patientSlug)} />
  }

  return <ClinicianApp />
}

export default App
