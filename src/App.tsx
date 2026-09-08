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
import { DocumentsModule } from './components/DocumentsModule'
import { PatientsModule } from './components/PatientsModule'
import { ConsultationsModule } from './components/ConsultationsModule'
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
import { REPORT_EXAMPLES, type ReportExample } from './clinical/demo-scenarios'
import { ReportIntake } from './components/ReportIntake'
import { getClinicalRepository } from './data/repository'
import { createEmptyDemoReport, demoReport } from './domain/demo'
import { reportWorkflowReducer } from './domain/report-workflow'
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
  'Atlas 3D',
  'Pacientes',
  'Consultas',
  'Exames',
  'Relatórios visuais',
  'Equipe',
  'Analytics',
  'Configurações',
] as const

type ModuleName = (typeof nav)[number]

const moduleMeta: Record<
  ModuleName,
  { eyebrow: string; title: string }
> = {
  'Visão geral': {
    eyebrow: 'MEDATLAS',
    title: 'Visão geral do fluxo clínico visual.',
  },
  'Atlas 3D': {
    eyebrow: 'ANATOMIA INTERATIVA',
    title: 'Explore e confirme estruturas de referência.',
  },
  Pacientes: {
    eyebrow: 'PACIENTES',
    title: 'Paciente, relatório e anatomia 3D no mesmo contexto.',
  },
  Consultas: {
    eyebrow: 'CONSULTAS',
    title: 'Acompanhe a sessão com a anatomia 3D sempre em contexto.',
  },
  Exames: {
    eyebrow: 'DOCUMENTOS CLÍNICOS',
    title: 'Do documento sintético à referência anatômica 3D.',
  },
  'Relatórios visuais': {
    eyebrow: 'CONSULTA VISUAL',
    title: 'Transforme o laudo em uma explicação que o paciente entende.',
  },
  Equipe: {
    eyebrow: 'ORGANIZAÇÃO',
    title: 'Papéis e permissões alinhados ao contrato de produção.',
  },
  Analytics: {
    eyebrow: 'USO E COMPARTILHAMENTO',
    title: 'Visualizações observadas nos relatórios compartilhados.',
  },
  Configurações: {
    eyebrow: 'ORGANIZAÇÃO',
    title: 'Estado real do ambiente demo, segurança e governança.',
  },
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

  const reportStepCompletion = [
    Boolean(report.finding.sourceText.trim()),
    !report.finding.anatomyReviewRequired &&
      Boolean(report.finding.atlasConceptId),
    !report.finding.explanationReviewRequired &&
      !report.finding.anatomyReviewRequired &&
      Boolean(report.finding.patientExplanation.trim()),
    report.status === 'published',
  ]

  const currentReportStep = reportStepCompletion.findIndex(
    (completed) => !completed,
  )

  const reportWorkflow = (
    <>
      <section className="workflow-strip workflow-strip-premium" aria-label="Fluxo do relatório">
        {[
          'Importar laudo',
          'Confirmar anatomia',
          'Revisar explicação',
          'Publicar ao paciente',
        ].map((step, index) => {
          const state = reportStepCompletion[index]
            ? 'done'
            : index === currentReportStep
              ? 'current'
              : 'pending'

          return (
            <div className={state} data-step-state={state} key={step}>
              <span>{reportStepCompletion[index] ? '✓' : index + 1}</span>
              <p>{step}</p>
              {state === 'current' && <small>Em andamento</small>}
            </div>
          )
        })}
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

      case 'Consultas':
        return (
          <ConsultationsModule
            report={report}
            onOpenReport={() => setActive('Relatórios visuais')}
            onNewReport={startNewReport}
            onOpenAtlas={() => setActive('Atlas 3D')}
          />
        )

      case 'Exames':
        return (
          <DocumentsModule
            report={report}
            onStartImport={startNewReport}
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

  const meta = moduleMeta[active]
  const activeWorkspace = getDemoWorkspace(activeWorkspaceId)
  const activeUnit = getDemoUnit(activeWorkspace?.unitId)
  const currentMember = getDemoCurrentMember()

  const globalSearchActions: GlobalSearchAction[] = [
    {
      id: 'action-new-report',
      label: 'Novo relatório visual',
      description: 'Iniciar um relatório sintético vazio.',
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
      label: 'Explorar Atlas 3D',
      description: 'Abrir o Human Atlas completo.',
      group: 'Ação',
      keywords: 'anatomia corpo fma human atlas',
      onSelect: () => setActive('Atlas 3D'),
    },
    {
      id: 'patient-demo',
      label: report.patient.displayName,
      description: 'Abrir o contexto sintético do paciente atual.',
      group: 'Paciente',
      keywords: report.title,
      onSelect: () => setActive('Pacientes'),
    },
    ...nav.map((item) => ({
      id: 'module-' + item,
      label: item,
      description: moduleMeta[item].title,
      group: 'Módulo' as const,
      keywords: moduleMeta[item].eyebrow,
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

        <button
          className="sidebar-3d-launcher"
          type="button"
          onClick={() => setActive('Atlas 3D')}
          aria-label="Abrir Human Atlas 3D"
        >
          <span aria-hidden="true">3D</span>
          <div>
            <strong>Human Atlas</strong>
            <small>Novo · anatomia interativa</small>
          </div>
          <b aria-hidden="true">→</b>
        </button>

        <nav aria-label="Navegação principal">
          {nav.map((item) => (
            <button
              key={item}
              type="button"
              className={active === item ? 'active' : ''}
              aria-label={item}
              aria-current={active === item ? 'page' : undefined}
              title={item}
              onClick={() => setActive(item)}
            >
              <span className="nav-dot" />
              <span>{item}</span>
            </button>
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
            <span className="eyebrow">ORGANIZAÇÃO ATIVA</span>
            <strong>{DEMO_ORGANIZATION_BRANDING.brandName}</strong>
            <small>
              {activeWorkspace?.name ?? 'Sem workspace'}
              {activeUnit ? ` · ${activeUnit.name}` : ''} · demonstração
            </small>
          </div>
          <span className="clinic-card-chevron" aria-hidden="true">⌃</span>
          <small className="clinic-card-data">
            {clinicalData.descriptor.label} · somente dados sintéticos
          </small>
        </div>
      </aside>

      <main className="workspace" id="clinical-workspace" tabIndex={-1}>
        <header className="topbar topbar-saas">
          <OrganizationSwitcher
            activeWorkspaceId={activeWorkspaceId}
            onWorkspaceChange={setActiveWorkspaceId}
          />

          <GlobalCommandSearch actions={globalSearchActions} />

          <TopbarUtilityActions
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
            onOpenExams={() => setActive('Exames')}
            onOpenTeam={() => setActive('Equipe')}
            onOpenSettings={() => setActive('Configurações')}
          />
        </header>

        <section className="module-heading">
          <div>
            <span className="eyebrow">{meta.eyebrow}</span>
            <h1>{meta.title}</h1>
          </div>
          <span className="synthetic-badge">DEMO · DADOS SINTÉTICOS</span>
        </section>

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
