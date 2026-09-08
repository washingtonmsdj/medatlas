import { useCallback, useState } from 'react'
import { deriveReportPresentation } from '../domain/report-presentation'
import { appHomeUrl } from '../app-url'
import type { AtlasView } from '../atlas/systems'
import type { VisualReport } from '../domain/types'
import { PATIENT_CLARITY_STEPS, PATIENT_CONVERSATION_QUESTIONS } from '../clinical/patient-communication'
import {
  DEMO_ORGANIZATION_BRANDING,
  getDemoCurrentMember,
} from '../organization/demo-organization'
import { HumanAtlasScene } from './HumanAtlasScene'
import { AttributionNotice } from './AttributionNotice'

interface Props {
  report: VisualReport
}

export function PatientReportPage({ report }: Props) {
  const currentMember = getDemoCurrentMember()
  const presentation = deriveReportPresentation(report)
  const [atlasStatus, setAtlasStatus] = useState<
    'loading' | 'ready' | 'error'
  >('loading')
  const [sourceLabel, setSourceLabel] = useState('')
  const [error, setError] = useState('')
  const [view, setView] = useState<AtlasView>('three-quarter')
  const [rotate, setRotate] = useState(false)
  const [reset, setReset] = useState(0)

  const ready = useCallback((label: string) => {
    setSourceLabel(label)
    setAtlasStatus('ready')
  }, [])

  const failed = useCallback((message: string) => {
    setError(message)
    setAtlasStatus('error')
  }, [])

  return (
    <main className="patient-shell" data-surface-priority="mobile-first">
      <header className="patient-header">
        <div className="brand">
          <span className="brand-mark">M</span>
          <span>MedAtlas</span>
        </div>

        <div className="patient-header-right">
          <div className="patient-clinic">
            <span>{DEMO_ORGANIZATION_BRANDING.brandName}</span>
            <small>Demonstração · dados fictícios · link temporário</small>
          </div>
          <button
            className="patient-print-button"
            type="button"
            onClick={() => window.print()}
          >
            Imprimir / salvar PDF
          </button>
        </div>
      </header>

      <section className="patient-hero patient-hero-premium patient-hero-v3">
        <div className="patient-hero-copy">
          <span className="section-kicker">SEU EXAME, EXPLICADO VISUALMENTE</span>
          <h1>{report.title}</h1>
          <p>
            Veja onde fica a região mencionada, entenda a explicação revisada
            pelo profissional e leve perguntas mais claras para a próxima
            conversa.
          </p>

          <div className="patient-report-chips" aria-label="Resumo do relatório">
            <span>
              <small>Região</small>
              <strong>{report.finding.anatomicalStructure}</strong>
            </span>
            <span>
              <small>Referência</small>
              <strong>{report.finding.atlasConceptId}</strong>
            </span>
            <span className="reviewed">
              <small>Status</small>
              <strong>{presentation.completion.explanation ? 'Revisado' : 'Pendente'}</strong>
            </span>
          </div>

          <nav
            className="patient-journey-nav"
            aria-label="Navegar pelas partes do relatório"
          >
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById('patient-anatomy')
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
            >
              <b>01</b>
              Anatomia
            </button>
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById('patient-explanation')
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
            >
              <b>02</b>
              Explicação
            </button>
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById('patient-questions')
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
            >
              <b>03</b>
              Perguntas
            </button>
          </nav>
        </div>

        <aside className="patient-review-summary">
          <span className="patient-review-icon">✓</span>
          <div>
            <span className="section-kicker">CONTEÚDO REVISADO</span>
            <strong>Preparado para comunicação com o paciente</strong>
            <p>
              {currentMember?.displayName ?? 'Profissional demo'} ·{' '}
              {currentMember?.professional?.specialty ?? 'Workspace clínico'}
              <br />
              {DEMO_ORGANIZATION_BRANDING.patientFooterText}
            </p>
          </div>
        </aside>
      </section>

      <section className="patient-grid patient-grid-v3">
        <section className="patient-atlas-card" id="patient-anatomy">
          <div className="patient-card-heading">
            <div>
              <span className="label">HUMAN ATLAS 3D · REGIÃO DESTACADA</span>
              <h2>{report.finding.anatomicalStructure}</h2>
            </div>
            <span className="atlas-badge">
              {report.finding.atlasConceptId}
            </span>
          </div>

          <div className="patient-atlas-stage">
            <HumanAtlasScene
              conceptId={report.finding.atlasConceptId}
              contextMode="system"
              view={view}
              rotate={rotate}
              reset={reset}
              appearance="patient"
              onReady={ready}
              onError={failed}
            />

            <div className="patient-atlas-status" role="status" aria-live="polite">
              {atlasStatus === 'ready' && (
                <>
                  <span className="live-dot" />
                  <span>{sourceLabel} · anatomia de referência</span>
                </>
              )}
              {atlasStatus === 'loading' && <span>Carregando anatomia 3D…</span>}
              {atlasStatus === 'error' && (
                <span>3D indisponível: {error}</span>
              )}
            </div>

            <nav
              className="patient-atlas-controls"
              aria-label="Controles da anatomia 3D de referência"
            >
              {([
                ['three-quarter', '3/4', 'Vista 3/4'],
                ['front', 'Frente', 'Vista frontal'],
                ['side', 'Lado', 'Vista lateral'],
              ] as const).map(([nextView, label, ariaLabel]) => (
                <button
                  key={nextView}
                  type="button"
                  className={view === nextView ? 'active' : ''}
                  aria-pressed={view === nextView}
                  aria-label={ariaLabel}
                  onClick={() => {
                    setView(nextView)
                    setRotate(false)
                    setReset((current) => current + 1)
                  }}
                >
                  {label}
                </button>
              ))}
              <button
                type="button"
                className={rotate ? 'active' : ''}
                aria-pressed={rotate}
                aria-label={
                  rotate
                    ? 'Pausar rotação do modelo 3D'
                    : 'Girar modelo 3D automaticamente'
                }
                onClick={() => setRotate((current) => !current)}
              >
                ↻
              </button>
              <button
                type="button"
                aria-label="Redefinir modelo 3D"
                onClick={() => {
                  setView('three-quarter')
                  setRotate(false)
                  setReset((current) => current + 1)
                }}
              >
                ↺
              </button>
            </nav>
          </div>

          <p className="patient-interaction-hint">
            Arraste para girar · role ou pince para aproximar · toque/clique numa estrutura para identificar · geometria BodyParts3D de referência
          </p>
        </section>

        <aside className="patient-explanation-card" id="patient-explanation">
          <span className="section-kicker">O QUE O LAUDO MENCIONA</span>
          <blockquote>{report.finding.sourceText}</blockquote>

          <div className="patient-explanation-section">
            <span className="label">EM LINGUAGEM MAIS SIMPLES</span>
            <p>{report.finding.patientExplanation}</p>
          </div>

          <div className="patient-review-stamp">
            <span>✓</span>
            <div>
              <strong>Conteúdo revisado antes do compartilhamento</strong>
              <small>
                O MedAtlas separa o rascunho assistido da versão aprovada pelo
                profissional.
              </small>
            </div>
          </div>

          <div className="patient-safety-note">
            <strong>Importante</strong>
            <p>{report.finding.clinicianNote}</p>
            <p>
              O modelo 3D mostra anatomia humana de referência. Ele não é uma
              reconstrução do seu corpo nem substitui a avaliação do
              profissional de saúde.
            </p>
          </div>
        </aside>
      </section>

      <section className="patient-clarity-strip" aria-label="Como usar o relatório visual">
        {PATIENT_CLARITY_STEPS.map((step, index) => (
          <article key={step.id}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <div>
              <strong>{step.title}</strong>
              <p>{step.description}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="patient-next-step patient-next-step-v3" id="patient-questions">
        <div>
          <span className="section-kicker">PARA SUA PRÓXIMA CONVERSA</span>
          <h2>Perguntas úteis para levar ao profissional</h2>
          <p>
            Estas perguntas são gerais e não pressupõem diagnóstico ou
            tratamento. Elas ajudam a transformar o relatório em uma conversa
            mais clara.
          </p>
        </div>

        <div className="patient-question-list">
          {PATIENT_CONVERSATION_QUESTIONS.map((question, index) => (
            <article key={question}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <p>{question}</p>
            </article>
          ))}
        </div>
      </section>

      <AttributionNotice compact />

      <footer className="patient-footer">
        <span>
          {DEMO_ORGANIZATION_BRANDING.patientFooterText} · MedAtlas · link local temporário
        </span>
        <button type="button" onClick={() => (window.location.href = appHomeUrl())}>
          Voltar ao ambiente clínico
        </button>
      </footer>
    </main>
  )
}

export function InvalidPatientLink() {
  return (
    <main className="patient-route-state patient-route-error">
      <div className="patient-route-state-card">
        <div className="brand">
          <span className="brand-mark">M</span>
          <span>MedAtlas</span>
        </div>

        <div className="patient-route-state-visual error" aria-hidden="true">
          <span>×</span>
        </div>

        <span className="section-kicker">LINK PROTEGIDO · ACESSO ENCERRADO</span>
        <h1>Este link de demonstração não está disponível.</h1>
        <p>
          Ele pode ter expirado, sido removido ou não existir neste navegador.
          O MedAtlas não tenta reconstruir nem exibir conteúdo quando a
          validação do link falha.
        </p>

        <div className="patient-route-safety-note">
          <span aria-hidden="true">✓</span>
          <div>
            <strong>Falha segura preservada</strong>
            <small>
              Nenhum relatório, explicação ou anatomia clínica é exibido sem
              uma referência de compartilhamento válida.
            </small>
          </div>
        </div>

        <button
          className="primary"
          type="button"
          onClick={() => (window.location.href = appHomeUrl())}
        >
          Ir para o ambiente clínico
        </button>
      </div>
    </main>
  )
}
