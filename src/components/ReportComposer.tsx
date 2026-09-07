import { useState } from 'react'
import { patientShareUrl } from '../app-url'
import type { VisualReport } from '../domain/types'

interface Props {
  report: VisualReport
  publishing: boolean
  publishError: string
  onPublish: () => void | Promise<void>
  onUpdateExplanation: (value: string) => void
  onApproveExplanation: () => void
}

export function ReportComposer({
  report,
  publishing,
  publishError,
  onPublish,
  onUpdateExplanation,
  onApproveExplanation,
}: Props) {
  const [copied, setCopied] = useState(false)

  const shareUrl =
    report.status === 'published' && report.shareSlug
      ? patientShareUrl(report.shareSlug)
      : ''

  const copyLink = async () => {
    if (!shareUrl) return

    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <aside className="report-card">
      <div className="section-kicker">RELATÓRIO VISUAL</div>
      <h2>{report.title}</h2>
      <p className="muted">
        {report.patient.displayName} · {report.patient.age} anos
      </p>

      <div className="report-section">
        <span className="label">Trecho do laudo</span>
        <blockquote>{report.finding.sourceText}</blockquote>
      </div>

      <div className="report-section">
        <span className="label">Explicação para o paciente</span>
        <textarea
          className="explanation-editor"
          aria-label="Explicação para o paciente"
          value={report.finding.patientExplanation}
          onChange={(event) => onUpdateExplanation(event.target.value)}
          rows={8}
        />
      </div>

      {report.finding.explanationReviewRequired ? (
        <div className="review-required-box">
          <strong>Revisão necessária</strong>
          <span>
            A anatomia ou a explicação mudou. O link do paciente só pode ser
            publicado após confirmação explícita do profissional.
          </span>
          <button type="button" onClick={onApproveExplanation}>
            Confirmar explicação revisada
          </button>
        </div>
      ) : (
        <div className="safety-box">
          <strong>Revisão clínica concluída</strong>
          <span>{report.finding.clinicianNote}</span>
        </div>
      )}

      {publishError && (
        <div className="publish-error" role="alert">
          {publishError}
        </div>
      )}

      {report.status === 'published' && report.shareSlug ? (
        <div className="share-box">
          <span>Link de demonstração gerado</span>
          <code>{shareUrl}</code>
          <div className="share-actions">
            <button className="primary" type="button" onClick={copyLink}>
              {copied ? 'Link copiado' : 'Copiar link'}
            </button>
            <button
              type="button"
              onClick={() =>
                window.open(shareUrl, '_blank', 'noopener,noreferrer')
              }
            >
              Abrir visão do paciente
            </button>
          </div>
          <small>
            MVP: token opaco aleatório + armazenamento demo local. Expiração,
            revogação e hash no banco já estão definidos no contrato Supabase
            e entram quando o backend dedicado for ativado.
          </small>
        </div>
      ) : (
        <button
          className="primary full"
          type="button"
          onClick={() => void onPublish()}
          disabled={
            report.finding.explanationReviewRequired || publishing
          }
        >
          {publishing
            ? 'Gerando link…'
            : report.finding.explanationReviewRequired
              ? 'Revise a explicação antes de publicar'
              : 'Aprovar e gerar link do paciente'}
        </button>
      )}
    </aside>
  )
}
