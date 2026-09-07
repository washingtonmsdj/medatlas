import { useState } from 'react'
import { patientShareUrl } from '../app-url'
import type { VisualReport } from '../domain/types'

interface Props {
  report: VisualReport
  publishing: boolean
  generatingDraft: boolean
  publishError: string
  onPublish: () => void | Promise<void>
  onGenerateDraft: () => void | Promise<void>
  onUpdateExplanation: (value: string) => void
  onApproveExplanation: () => void
}

function provenanceLabel(report: VisualReport) {
  const provenance = report.finding.explanationProvenance

  if (provenance.origin === 'deterministic') {
    return provenance.clinicianEdited
      ? 'Rascunho MedAtlas editado pelo profissional'
      : 'Rascunho educacional MedAtlas'
  }

  if (provenance.origin === 'ai') {
    return provenance.clinicianEdited
      ? 'Rascunho de IA editado pelo profissional'
      : 'Rascunho de IA · revisão obrigatória'
  }

  return 'Texto manual do profissional'
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

  const canWorkOnExplanation =
    !report.finding.anatomyReviewRequired &&
    Boolean(report.finding.atlasConceptId)

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
            {generatingDraft ? 'Gerando…' : 'Gerar rascunho educacional'}
          </button>
        </div>

        {report.finding.anatomyReviewRequired && (
          <div className="explanation-blocked-note">
            Confirme novamente a anatomia para o texto atual antes de preparar
            a explicação.
          </div>
        )}

        <textarea
          className="explanation-editor"
          aria-label="Explicação para o paciente"
          value={report.finding.patientExplanation}
          onChange={(event) => onUpdateExplanation(event.target.value)}
          rows={8}
          placeholder="Gere um rascunho educacional ou escreva a explicação manualmente."
          disabled={!canWorkOnExplanation}
        />

        {report.finding.explanationProvenance.origin === 'deterministic' && (
          <p className="provenance-note">
            Gerador: {report.finding.explanationProvenance.generatorId} · v
            {report.finding.explanationProvenance.generatorVersion}. O texto
            continua bloqueado para publicação até revisão explícita.
          </p>
        )}
      </div>

      {report.finding.explanationReviewRequired ? (
        <div className="review-required-box">
          <strong>Revisão necessária</strong>
          <span>
            A anatomia, o laudo ou a explicação mudou. O link do paciente só
            pode ser publicado após confirmação explícita do profissional.
          </span>
          <button
            type="button"
            onClick={onApproveExplanation}
            disabled={
              report.finding.anatomyReviewRequired ||
              !report.finding.patientExplanation.trim()
            }
          >
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
            MVP sem backend: token opaco aleatório + armazenamento local
            exclusivamente sintético, com expiração automática em 30 minutos.
            O contrato de produção com revogação e hash permanece pronto para a
            fase de backend.
          </small>
        </div>
      ) : (
        <button
          className="primary full"
          type="button"
          onClick={() => void onPublish()}
          disabled={
            report.finding.anatomyReviewRequired ||
            report.finding.explanationReviewRequired ||
            publishing ||
            !report.finding.patientExplanation.trim()
          }
        >
          {publishing
            ? 'Gerando link…'
            : report.finding.anatomyReviewRequired
              ? 'Confirme a anatomia antes de publicar'
              : report.finding.explanationReviewRequired
                ? 'Revise a explicação antes de publicar'
                : 'Aprovar e gerar link do paciente'}
        </button>
      )}
    </aside>
  )
}
