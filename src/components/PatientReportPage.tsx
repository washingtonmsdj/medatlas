import { useCallback, useState } from 'react'
import { appHomeUrl } from '../app-url'
import type { AtlasView } from '../atlas/systems'
import type { VisualReport } from '../domain/types'
import { HumanAtlasScene } from './HumanAtlasScene'
import { AttributionNotice } from './AttributionNotice'

interface Props {
  report: VisualReport
}

const QUESTIONS = [
  'Qual é a importância deste achado no meu caso?',
  'Este achado pode ter relação com meus sintomas?',
  'Preciso de acompanhamento, novos exames ou alguma mudança de rotina?',
]

export function PatientReportPage({ report }: Props) {
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
    <main className="patient-shell">
      <header className="patient-header">
        <div className="brand">
          <span className="brand-mark">M</span>
          <span>MedAtlas</span>
        </div>

        <div className="patient-header-right">
          <div className="patient-clinic">
            <span>Clínica Horizonte</span>
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

      <section className="patient-hero">
        <span className="section-kicker">SEU EXAME, EXPLICADO VISUALMENTE</span>
        <h1>{report.title}</h1>
        <p>
          Esta página foi preparada para ajudar você a visualizar a região
          mencionada no relatório e entender a explicação revisada pelo
          profissional.
        </p>
      </section>

      <section className="patient-grid">
        <section className="patient-atlas-card">
          <div className="patient-card-heading">
            <div>
              <span className="label">REGIÃO DESTACADA</span>
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
              aria-label="Controles do modelo 3D do paciente"
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
            Arraste para girar · role ou pince para aproximar
          </p>
        </section>

        <aside className="patient-explanation-card">
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

      <section className="patient-next-step">
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
          {QUESTIONS.map((question, index) => (
            <article key={question}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <p>{question}</p>
            </article>
          ))}
        </div>
      </section>

      <AttributionNotice compact />

      <footer className="patient-footer">
        <span>MedAtlas · demonstração com dados fictícios · link local temporário</span>
        <button type="button" onClick={() => (window.location.href = appHomeUrl())}>
          Voltar ao ambiente clínico
        </button>
      </footer>
    </main>
  )
}

export function InvalidPatientLink() {
  return (
    <main className="invalid-share">
      <div className="brand">
        <span className="brand-mark">M</span>
        <span>MedAtlas</span>
      </div>
      <h1>Este link de demonstração não está disponível.</h1>
      <p>
        No produto final, links de paciente serão opacos, expiráveis e
        revogáveis. Este MVP armazena somente o relatório sintético no
        navegador que o publicou.
      </p>
      <button
        className="primary"
        type="button"
        onClick={() => (window.location.href = appHomeUrl())}
      >
        Ir para o ambiente clínico
      </button>
    </main>
  )
}
