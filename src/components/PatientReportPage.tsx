import { lazy, Suspense, useCallback, useMemo, useState } from 'react'
import { deriveReportPresentation } from '../domain/report-presentation'
import { appHomeUrl } from '../app-url'
import type { AtlasView } from '../atlas/systems'
import { resolveOrganDetail } from '../anatomy-detail/catalog'
import type { VisualReport } from '../domain/types'
import { PATIENT_CONVERSATION_QUESTIONS } from '../clinical/patient-communication'
import {
  DEMO_ORGANIZATION_BRANDING,
  getDemoCurrentMember,
} from '../organization/demo-organization'
import { HumanAtlasScene } from './HumanAtlasScene'
import { AttributionNotice } from './AttributionNotice'

const OrganDetailScene = lazy(async () => {
  const module = await import('./OrganDetailScene')
  return { default: module.OrganDetailScene }
})

interface Props {
  report: VisualReport
  previewMode?: boolean
  onSwitchToProfessional?: () => void
}

export function PatientReportPage({
  report,
  previewMode = false,
  onSwitchToProfessional,
}: Props) {
  const currentMember = getDemoCurrentMember()
  const presentation = deriveReportPresentation(report)
  const hasAnatomy = Boolean(report.finding.atlasConceptId)
  const [atlasStatus, setAtlasStatus] = useState<
    'idle' | 'loading' | 'ready' | 'error'
  >(hasAnatomy ? 'loading' : 'idle')
  const [sourceLabel, setSourceLabel] = useState('')
  const [view, setView] = useState<AtlasView>('three-quarter')
  const [rotate, setRotate] = useState(false)
  const [section, setSection] = useState(false)
  const [reset, setReset] = useState(0)
  const [sceneAttempt, setSceneAttempt] = useState(0)
  const [anatomyLevel, setAnatomyLevel] = useState<'body' | 'detail'>('body')

  const organDetail = useMemo(
    () =>
      resolveOrganDetail(
        report.finding.atlasConceptId || undefined,
        report.finding.anatomicalStructure,
      ),
    [
      report.finding.atlasConceptId,
      report.finding.anatomicalStructure,
    ],
  )
  const detailActive = anatomyLevel === 'detail' && Boolean(organDetail)

  const ready = useCallback((label: string) => {
    setSourceLabel(label)
    setAtlasStatus('ready')
  }, [])

  const failed = useCallback(() => {
    setAtlasStatus('error')
  }, [])

  const retryAtlas = () => {
    setAtlasStatus('loading')
    setSourceLabel('')
    setRotate(false)
    setSection(false)
    setSceneAttempt((current) => current + 1)
    setReset((current) => current + 1)
  }

  return (
    <main className="patient-shell" data-surface-priority="mobile-first">
      <header className="patient-header">
        <div className="brand">
          <span className="brand-mark">M</span>
          <span>MedAtlas</span>
        </div>

        <div className="patient-header-right">
          {previewMode && onSwitchToProfessional && (
            <button
              className="patient-return-professional"
              type="button"
              onClick={onSwitchToProfessional}
            >
              <span aria-hidden="true">←</span>
              Voltar ao profissional
            </button>
          )}
          <div className="patient-clinic">
            <span>{DEMO_ORGANIZATION_BRANDING.brandName}</span>
            <small>
              {previewMode ? 'Prévia · dados fictícios' : 'Relatório compartilhado'}
            </small>
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

      <section className="patient-hero">
        <div className="patient-hero-copy">
          <span className="section-kicker">
            {previewMode ? 'VISÃO DO PACIENTE · PRÉVIA' : 'SEU RELATÓRIO VISUAL'}
          </span>
          <h1>{report.title}</h1>
          <p>Veja a região em 3D e leia a explicação revisada.</p>

          <div className="patient-report-chips" aria-label="Resumo do relatório">
            <span>
              <small>Região</small>
              <strong>{report.finding.anatomicalStructure}</strong>
            </span>
            <span>
              <small>Visualização</small>
              <strong>{hasAnatomy ? '3D disponível' : 'Aguardando'}</strong>
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
          <span className="patient-review-icon">
            {presentation.completion.explanation ? '✓' : '•'}
          </span>
          <div>
            <span className="section-kicker">
              {presentation.completion.explanation ? 'REVISADO' : 'PRÉVIA'}
            </span>
            <strong>
              {presentation.completion.explanation
                ? 'Pronto para o paciente'
                : 'Relatório em edição'}
            </strong>
            <p>
              {currentMember?.displayName ?? 'Profissional demo'} ·{' '}
              {currentMember?.professional?.specialty ?? 'Clínica'}
            </p>
          </div>
        </aside>
      </section>

      <section className="patient-grid">
        <section className="patient-atlas-card" id="patient-anatomy">
          <div className="patient-card-heading">
            <div>
              <span className="label">HUMAN ATLAS 3D</span>
              <h2>{report.finding.anatomicalStructure}</h2>
            </div>
            <span className="atlas-badge">
              {hasAnatomy ? '3D' : 'Aguardando'}
            </span>
          </div>

          <div className={detailActive ? 'patient-atlas-stage detail-active' : 'patient-atlas-stage'}>
            {hasAnatomy && organDetail && (
              <nav
                className="patient-anatomy-depth-switch"
                aria-label="Nível da anatomia 3D"
              >
                <button
                  type="button"
                  className={anatomyLevel === 'body' ? 'active' : ''}
                  aria-pressed={anatomyLevel === 'body'}
                  onClick={() => {
                    setAnatomyLevel('body')
                    setAtlasStatus('loading')
                    setSourceLabel('')
                    setRotate(false)
                    setSection(false)
                    setReset((current) => current + 1)
                  }}
                >
                  Corpo completo
                </button>
                <button
                  type="button"
                  className={detailActive ? 'active' : ''}
                  aria-pressed={detailActive}
                  onClick={() => {
                    setAnatomyLevel('detail')
                    setAtlasStatus('loading')
                    setSourceLabel('')
                    setRotate(false)
                    setSection(false)
                    setReset((current) => current + 1)
                  }}
                >
                  Ver {organDetail.label} em detalhe
                </button>
              </nav>
            )}

            {hasAnatomy ? (
              detailActive && organDetail ? (
                <Suspense
                  fallback={
                    <div
                      className="focused-reference-loading renderer-module-loading"
                      role="status"
                      aria-live="polite"
                    >
                      <div className="focused-reference-loading-card">
                        <span
                          className="focused-reference-loader"
                          aria-hidden="true"
                        />
                        <div>
                          <strong>Carregando detalhe 3D</strong>
                          <small>Preparando {organDetail.label}.</small>
                        </div>
                      </div>
                    </div>
                  }
                >
                  <OrganDetailScene
                    key={`${organDetail.id}-${sceneAttempt}`}
                    organ={organDetail}
                    appearance="patient"
                    rotate={rotate}
                    section={section}
                    reset={reset}
                    onReady={ready}
                    onError={failed}
                  />
                </Suspense>
              ) : (
                <HumanAtlasScene
                  key={`${report.finding.atlasConceptId}-${sceneAttempt}`}
                  conceptId={report.finding.atlasConceptId}
                  contextMode="system"
                  view={view}
                  rotate={rotate}
                  reset={reset}
                  appearance="patient"
                  onReady={ready}
                  onError={failed}
                />
              )
            ) : (
              <div className="patient-atlas-empty">
                <span aria-hidden="true">3D</span>
                <strong>Anatomia ainda não selecionada</strong>
                <p>Confirme uma estrutura na visão profissional.</p>
              </div>
            )}

            <div className="patient-atlas-status" role="status" aria-live="polite">
              {atlasStatus === 'ready' && (
                <>
                  <span className="live-dot" />
                  <span>{sourceLabel}</span>
                </>
              )}
              {atlasStatus === 'loading' && <span>Carregando anatomia 3D…</span>}
              {atlasStatus === 'idle' && <span>Aguardando anatomia</span>}
              {atlasStatus === 'error' && (
                <>
                  <span>3D indisponível</span>
                  <button
                    className="atlas-retry-button"
                    type="button"
                    onClick={retryAtlas}
                  >
                    Tentar novamente
                  </button>
                </>
              )}
            </div>

            {hasAnatomy && (
              <nav
                className="patient-atlas-controls"
                aria-label="Controles da anatomia 3D de referência"
              >
                {!detailActive &&
                  ([
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
                {detailActive && (
                  <button
                    type="button"
                    className={section ? 'active' : ''}
                    aria-pressed={section}
                    aria-label={
                      section
                        ? 'Desativar corte do órgão'
                        : 'Ativar corte do órgão'
                    }
                    onClick={() => {
                      setSection((current) => !current)
                      setRotate(false)
                    }}
                  >
                    Corte
                  </button>
                )}
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
                    setSection(false)
                    setReset((current) => current + 1)
                  }}
                >
                  ↺
                </button>
              </nav>
            )}
          </div>

          {hasAnatomy && (
            <>
              <p className="patient-interaction-hint">
                {detailActive
                  ? 'Arraste para girar · pince ou role para aproximar · use Corte para explorar'
                  : 'Arraste para girar · pince ou role para aproximar · toque para identificar'}
              </p>
              {detailActive && (
                <p className="patient-organ-detail-safety">
                  O modelo detalhado é uma referência anatômica e não representa o corpo individual do paciente.
                </p>
              )}
            </>
          )}
        </section>

        <aside className="patient-explanation-card" id="patient-explanation">
          <span className="section-kicker">LAUDO</span>
          <blockquote>
            {report.finding.sourceText || 'O texto do exame aparecerá aqui.'}
          </blockquote>

          <div className="patient-explanation-section">
            <span className="label">EXPLICAÇÃO</span>
            <p>
              {report.finding.patientExplanation ||
                'A explicação aparecerá aqui após a revisão profissional.'}
            </p>
          </div>

          <div className="patient-review-stamp">
            <span>✓</span>
            <div>
              <strong>
                {presentation.completion.explanation
                  ? 'Explicação revisada'
                  : 'Prévia em edição'}
              </strong>
              <small>
                {presentation.completion.explanation
                  ? 'Pronta para o paciente.'
                  : 'Ainda não compartilhada.'}
              </small>
            </div>
          </div>

          <div className="patient-safety-note">
            <strong>Importante</strong>
            <p>{report.finding.clinicianNote}</p>
            <p>O 3D é uma referência anatômica e não substitui a avaliação profissional.</p>
          </div>
        </aside>
      </section>

      <section className="patient-next-step" id="patient-questions">
        <div>
          <span className="section-kicker">PRÓXIMA CONVERSA</span>
          <h2>Perguntas para levar ao profissional</h2>
          <p>Use estas perguntas como apoio para conversar sobre o relatório.</p>
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
          {DEMO_ORGANIZATION_BRANDING.patientFooterText} · MedAtlas
          {previewMode ? ' · prévia' : ''}
        </span>
        <button
          type="button"
          onClick={() => {
            if (previewMode && onSwitchToProfessional) {
              onSwitchToProfessional()
              return
            }
            window.location.href = appHomeUrl()
          }}
        >
          {previewMode ? 'Voltar para visão profissional' : 'Voltar ao MedAtlas'}
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

        <span className="section-kicker">LINK INDISPONÍVEL</span>
        <h1>Este link não está disponível.</h1>
        <p>O link pode ter expirado ou sido removido. Solicite um novo link à clínica.</p>

        <button
          className="primary"
          type="button"
          onClick={() => (window.location.href = appHomeUrl())}
        >
          Voltar ao MedAtlas
        </button>
      </div>
    </main>
  )
}
