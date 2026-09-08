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
import { TeamModule } from './components/TeamModule'
import { PatientsModule } from './components/PatientsModule'
import { Overview } from './components/Overview'
import { OrganizationSwitcher } from './components/OrganizationSwitcher'
import {
  InvalidPatientLink,
  PatientReportPage,
} from './components/PatientReportPage'
import { ReportComposer } from './components/ReportComposer'
import { ReferenceAtlasExplorer } from './components/ReferenceAtlasExplorer'
import { GlobalCommandSearch, type GlobalSearchAction } from './components/GlobalCommandSearch'
import { TopbarUtilityActions } from './components/TopbarUtilityActions'
import { ViewModeSwitcher, type MedAtlasViewMode } from './components/ViewModeSwitcher'
import { REPORT_EXAMPLES, type ReportExample } from './clinical/demo-scenarios'
import { ReportIntake } from './components/ReportIntake'
import { getClinicalRepository } from './data/repository'
import { createEmptyDemoReport, demoReport } from './domain/demo'
import { reportWorkflowReducer } from './domain/report-workflow'
import { deriveReportPresentation } from './domain/report-presentation'
import type { VisualReport } from './domain/types'
import {
  DEFAULT_DEMO_WORKSPACE_ID,
  DEMO_ORGANIZATION,
  DEMO_ORGANIZATION_BRANDING,
  getDemoCurrentMember,
  getDemoUnit,
  getDemoWorkspace,
  ROLE_LABELS,
} from './organization/demo-organization'

const nav = [
  'Visão geral',
  'Pacientes',
  'Relatórios visuais',
  'Atlas 3D',
  'Analytics',
  'Equipe',
  'Configurações',
] as const

type ModuleName = (typeof nav)[number]

const navGroups: ReadonlyArray<{
  label: string
  items: readonly ModuleName[]
}> = [
  {
    label: 'Clínica',
    items: ['Visão geral', 'Pacientes', 'Relatórios visuais', 'Atlas 3D'],
  },
  {
    label: 'Gestão',
    items: ['Analytics', 'Equipe', 'Configurações'],
  },
]

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

          <span className="section-kicker">LINK DO PACIENTE · VALIDAÇÃO SEGURA</span>
          <h1>Preparando seu relatório visual…</h1>
          <p>
            Estamos verificando se este link ainda está válido antes de
            carregar qualquer conteúdo.
          </p>

          <div className="patient-route-state-steps" aria-hidden="true">
            <span className="active">Validar link</span>
            <span>Carregar relatório</span>
            <span>Preparar anatomia 3D</span>
          </div>

          <small>
            Nenhum conteúdo é exibido enquanto a validação não terminar.
          </small>
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
  const [viewMode, setViewMode] = useState<MedAtlasViewMode>('professional')
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(
    DEFAULT_DEMO_WORKSPACE_ID,
  )
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

  const reportPresentation = deriveReportPresentation(report)

  const reportWorkflow = (
    <>
      <section className="workflow-strip workflow-strip-premium" aria-label="Fluxo do relatório">
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
              <small>Fonte clínica e estruturas sugeridas</small>
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
              <strong>Visualização 3D</strong>
              <small>Confirme a referência anatômica</small>
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
                  ? 'Analise o texto ou use a busca do atlas para escolher uma referência.'
                  : report.finding.anatomyReviewRequired
                    ? 'O texto mudou. Confirme novamente a estrutura antes de continuar.'
                    : 'Referência visual validada para esta versão do texto.'}
              </p>
            </div>

            <div className="finding-match">
              <span>Referência</span>
              <strong>
                {!report.finding.atlasConceptId
                  ? 'Aguardando seleção'
                  : report.finding.anatomyReviewRequired
                    ? 'Revisar seleção'
                    : report.finding.atlasConceptId}
              </strong>
              <small>
                {report.finding.atlasConceptId
                  ? `${report.finding.atlasRef} · ${report.finding.atlasConceptId}`
                  : `${report.finding.atlasRef} · nenhuma referência confirmada`}
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
              <small>Rascunho assistido + revisão clínica</small>
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
    </>
  )

  const renderModule = () => {
    switch (active) {
      case 'Visão geral':
        return (
          <Overview
            report={report}
            organizationName={DEMO_ORGANIZATION.name}
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
            onConfirmConcept={confirmConcept}
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
        return <DemoSettings onNewReport={startNewReport} />
    }
  }

  const activeWorkspace = getDemoWorkspace(activeWorkspaceId)
  const activeUnit = getDemoUnit(activeWorkspace?.unitId)
  const currentMember = getDemoCurrentMember()

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
    ...nav.map((item) => ({
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
    <div className="app-shell">
      <a className="skip-link" href="#clinical-workspace">
        Ir para o conteúdo principal
      </a>
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">M</span>
          <span>MedAtlas</span>
        </div>
        <p className="brand-subtitle">Comunicação clínica visual</p>


        <nav aria-label="Navegação principal">
          {navGroups.map((group) => (
            <section className="sidebar-nav-group" key={group.label}>
              <span className="sidebar-nav-label">{group.label}</span>
              {group.items.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={[
                    active === item ? 'active' : '',
                    item === 'Atlas 3D' ? 'atlas-nav-item' : '',
                  ].filter(Boolean).join(' ')}
                  aria-label={item === 'Relatórios visuais' ? 'Relatórios' : item}
                  aria-current={active === item ? 'page' : undefined}
                  title={item}
                  onClick={() => setActive(item)}
                >
                  <span className="nav-dot" />
                  <span>{item === 'Relatórios visuais' ? 'Relatórios' : item}</span>
                </button>
              ))}
            </section>
          ))}
        </nav>

        <div className="clinic-card clinic-card-premium">
          <div
            className="clinic-card-logo"
            style={{ background: DEMO_ORGANIZATION_BRANDING.primaryColorHex }}
          >
            {DEMO_ORGANIZATION_BRANDING.markText}
          </div>
          <div>
            <span className="eyebrow">CLÍNICA</span>
            <strong>{DEMO_ORGANIZATION_BRANDING.brandName}</strong>
            <small>
              {activeWorkspace?.name ?? 'Sem workspace'}
              {activeUnit ? ` · ${activeUnit.name}` : ''}
            </small>
          </div>
          <span className="clinic-card-chevron" aria-hidden="true">⌃</span>
        </div>
      </aside>

      <main className="workspace" id="clinical-workspace" tabIndex={-1}>
        <header className="topbar topbar-saas">
          <OrganizationSwitcher
            activeWorkspaceId={activeWorkspaceId}
            onWorkspaceChange={setActiveWorkspaceId}
          />

          <ViewModeSwitcher mode={viewMode} onChange={setViewMode} />

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
          />
        </header>

        <DemoPrivacyBanner />

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
