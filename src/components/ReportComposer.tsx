import { useState } from 'react'
import { patientShareUrl } from '../app-url'
import { deriveReportPresentation } from '../domain/report-presentation'
import type { VisualReport } from '../domain/types'
import { demoShareTtlLabel } from '../product/constraints'

interface Props {
  report: VisualReport
  publishing: boolean
  generatingDraft: boolean
  publishError: string
  onPublish: () => void | Promise<void>
  onGenerateDraft: () => void | Promise<void>
  onUpdateExplanation: (value: string) => void
  onApproveExplanation: () => void
  onPreviewPatient: () => void
}

function provenanceLabel(report: VisualReport) {
  if (report.finding.explanationProvenance.clinicianEdited) {
    return 'Editado pelo profissional'
  }

  if (report.finding.explanationProvenance.origin === 'manual') {
    return 'Escrito pelo profissional'
  }

  return 'Gerado pelo MedAtlas'
}

export function ReportComposer({
  report,
  publishing,
  generatingDraft,
  publishError,
  onPublish,
  onGenerateDraft,
  onUpdateExplanation,
  onApproveExplanation,
  onPreviewPatient,
}: Props) {
  const [copied, setCopied] = useState(false)
  const presentation = deriveReportPresentation(report)

  const shareUrl =
    report.status === 'published' && report.shareSlug
      ? patientShareUrl(report.shareSlug)
      : ''

  const canWorkOnExplanation = presentation.completion.anatomy
  const hasExplanation = presentation.explanation.state !== 'empty'
  const reviewComplete = presentation.completion.explanation

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
    <aside className="report-card report-composer">
      <header className="report-composer-header">
        <div>
          <span className="section-kicker">EXPLICAÇÃO</span>
          <h2>{report.patient.displayName}</h2>
          <p className="muted">{report.title}</p>
        </div>

        <span
          className={`composer-status ${reviewComplete ? 'approved' : 'pending'}`}
        >
          <i aria-hidden="true" />
          {presentation.statusLabel}
        </span>
      </header>

      <details className="source-excerpt">
        <summary>
          <span>
            <b>Laudo de origem</b>
            <small>ver texto</small>
          </span>
          <i aria-hidden="true">⌄</i>
        </summary>
        <blockquote>
          {report.finding.sourceText || 'Nenhum texto clínico informado.'}
        </blockquote>
      </details>

      <section className="report-section explanation-workspace">
        <div className="explanation-heading">
          <div>
            <span className="label">Explicação para o paciente</span>
            <small>{provenanceLabel(report)}</small>
          </div>

          <button
            className="generate-draft-button"
            type="button"
            onClick={() => void onGenerateDraft()}
            disabled={
              generatingDraft ||
              !canWorkOnExplanation ||
              !report.finding.sourceText.trim()
            }
          >
            {generatingDraft ? 'Gerando…' : 'Gerar rascunho'}
          </button>
        </div>

        {report.finding.anatomyReviewRequired && (
          <div className="explanation-blocked-note">
            <strong>Confirme a anatomia para continuar</strong>
            <span>A explicação será liberada após a confirmação.</span>
          </div>
        )}

        <div className="explanation-editor-shell">
          <textarea
            className="explanation-editor"
            aria-label="Explicação para o paciente"
            value={report.finding.patientExplanation}
            onChange={(event) => onUpdateExplanation(event.target.value)}
            rows={9}
            placeholder="Escreva ou gere uma explicação clara para o paciente."
            disabled={!canWorkOnExplanation}
          />
          <div className="explanation-editor-meta">
            <span>{presentation.explanation.detail}</span>
          </div>
        </div>
      </section>

      {!reviewComplete ? (
        <section className="review-required-box">
          <div className="review-gate-heading">
            <span aria-hidden="true">!</span>
            <div>
              <strong>Revise antes de compartilhar</strong>
              <small>Confirme o texto que o paciente verá</small>
            </div>
          </div>
          <button
            type="button"
            onClick={onApproveExplanation}
            disabled={!canWorkOnExplanation || !hasExplanation}
          >
            Aprovar explicação
          </button>
        </section>
      ) : (
        <section className="safety-box">
          <span aria-hidden="true">✓</span>
          <div>
            <strong>Explicação aprovada</strong>
            <p>
              Revisada por {report.reviewApproval?.approvedBy.displayName}.
            </p>
          </div>
        </section>
      )}

      {hasExplanation && canWorkOnExplanation && (
        <section className="patient-preview-control patient-view-control">
          <button type="button" onClick={onPreviewPatient}>
            <span aria-hidden="true">◉</span>
            Prévia do paciente
          </button>
        </section>
      )}

      {publishError && (
        <div className="publish-error" role="alert">
          {publishError}
        </div>
      )}

      {presentation.completion.share && shareUrl ? (
        <section className="share-box">
          <div className="share-ready-heading">
            <span aria-hidden="true">✓</span>
            <div>
              <strong>Link pronto para enviar</strong>
              <small>expira em {demoShareTtlLabel()}</small>
            </div>
          </div>
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
              Abrir link
            </button>
          </div>
        </section>
      ) : (
        <div className="publish-zone">
          <div>
            <strong>Compartilhar com o paciente</strong>
            <span>{presentation.publication.summary}</span>
          </div>
          <button
            className="primary full"
            type="button"
            onClick={() => void onPublish()}
            disabled={!presentation.publication.canPublish || publishing}
          >
            {publishing ? 'Gerando link…' : presentation.publication.buttonLabel}
          </button>
        </div>
      )}
    </aside>
  )
}
