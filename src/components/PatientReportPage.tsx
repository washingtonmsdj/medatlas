import { useCallback, useState } from 'react'
import { appHomeUrl } from '../app-url'
import type { VisualReport } from '../domain/types'
import { HumanAtlasScene } from './HumanAtlasScene'

interface Props {
  report: VisualReport
}

export function PatientReportPage({ report }: Props) {
  const [atlasStatus, setAtlasStatus] = useState<
    'loading' | 'ready' | 'error'
  >('loading')
  const [sourceLabel, setSourceLabel] = useState('')
  const [error, setError] = useState('')

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
        <div className="patient-clinic">
          <span>Clínica Horizonte</span>
          <small>Demonstração · relatório visual</small>
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
              showContext
              onReady={ready}
              onError={failed}
            />

            <div className="patient-atlas-status">
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

      <footer className="patient-footer">
        <span>MedAtlas · experiência demonstrativa com dados fictícios</span>
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
