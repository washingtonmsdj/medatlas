import { useEffect, useState } from 'react'
import { patientShareUrl } from '../app-url'
import { deriveReportPresentation } from '../domain/report-presentation'
import type { VisualReport } from '../domain/types'
import { demoShareTtlLabel } from '../product/constraints'
import { AnatomyFocusPreview } from './AnatomyFocusPreview'

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
}: Props) {
  const [copied, setCopied] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const presentation = deriveReportPresentation(report)

  useEffect(() => {
    setPreviewOpen(false)
  }, [report.finding.atlasConceptId, report.finding.sourceText])

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
    <aside className="report-card report-card-v2 report-composer-v3">
      <header className="report-composer-header">
        <div>
          <span className="section-kicker">EXPLICAÇÃO AO PACIENTE</span>
          <h2>{report.title}</h2>
          <p className="muted">
            {report.patient.displayName} · {report.patient.age} anos
          </p>
        </div>

        <span
          className={`composer-status ${reviewComplete ? 'approved' : 'pending'}`}
        >
          <i aria-hidden="true" />
          {presentation.statusLabel}
        </span>
      </header>

      <div className="composer-progress" aria-label="Status da preparação">
        {presentation.composerStages.map((item, index) => (
          <div className={item.done ? 'done' : ''} key={item.id}>
            <span>{item.done ? '✓' : index + 1}</span>
            <div>
              <strong>{item.label}</strong>
              <small>{item.detail}</small>
            </div>
          </div>
        ))}
      </div>

      <details className="source-excerpt">
        <summary>
          <span>
            <b>Trecho do laudo</b>
            <small>fonte usada para esta explicação</small>
          </span>
          <i aria-hidden="true">⌄</i>
        </summary>
        <blockquote>
          {report.finding.sourceText || 'Nenhum texto clínico informado.'}
        </blockquote>
      </details>

      <section className="report-section explanation-workspace">
        <div className="explanation-heading explanation-heading-v2">
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
            {generatingDraft ? 'Gerando…' : 'Gerar explicação'}
          </button>
        </div>

        {report.finding.anatomyReviewRequired && (
          <div className="explanation-blocked-note">
            <strong>Anatomia ainda não confirmada</strong>
            <span>
              Confirme a estrutura para o texto atual antes de preparar a
              explicação.
            </span>
          </div>
        )}

        <div className="explanation-editor-shell">
          <textarea
            className="explanation-editor"
            aria-label="Explicação para o paciente"
            value={report.finding.patientExplanation}
            onChange={(event) => {
              setPreviewOpen(false)
              onUpdateExplanation(event.target.value)
            }}
            rows={9}
            placeholder="Escreva ou gere uma explicação para o paciente."
            disabled={!canWorkOnExplanation}
          />
          <div className="explanation-editor-meta">
            <span>{presentation.explanation.detail}</span>
            <span>
              {report.finding.explanationReviewRequired
                ? 'edição exige nova revisão'
                : 'versão revisada'}
            </span>
          </div>
        </div>

      </section>

      {report.finding.explanationReviewRequired ? (
        <section className="review-required-box review-gate-v2">
          <div className="review-gate-heading">
            <span aria-hidden="true">!</span>
            <div>
              <strong>Revisão necessária</strong>
              <small>Confirme antes de compartilhar</small>
            </div>
          </div>
          <p>Revise a explicação antes de liberar o link.</p>
          <button
            type="button"
            onClick={onApproveExplanation}
            disabled={!canWorkOnExplanation || !hasExplanation}
          >
            Marcar como revisada
          </button>
        </section>
      ) : (
        <section className="safety-box review-approved-v2">
          <span aria-hidden="true">✓</span>
          <div>
            <strong>Revisão clínica concluída</strong>
            <p>{report.finding.clinicianNote}</p>
          </div>
        </section>
      )}

      {hasExplanation && canWorkOnExplanation && report.status !== 'published' && (
        <section className="patient-preview-control">
          <button
            type="button"
            aria-expanded={previewOpen}
            onClick={() => setPreviewOpen((current) => !current)}
          >
            <span aria-hidden="true">◫</span>
            {previewOpen
              ? 'Fechar visão do paciente'
              : 'Ver como paciente'}
          </button>

          {previewOpen && (
            <div
              className="patient-preview-card patient-preview-card-live"
              role="region"
              aria-label="Preview do paciente"
            >
              <div className="patient-preview-live-heading">
                <span>VISÃO DO PACIENTE</span>
                <strong>Prévia do relatório</strong>
                <small>Ainda não compartilhada.</small>
              </div>

              <AnatomyFocusPreview
                conceptId={report.finding.atlasConceptId || undefined}
                label={report.finding.anatomicalStructure}
                atlasRef={report.finding.atlasRef}
                eyebrow="HUMAN ATLAS 3D · VISÃO DO PACIENTE"
                appearance="patient"
                contextMode="system"
                compact
                description="Prévia real do modelo anatômico que acompanha o link do paciente. Anatomia humana de referência, não reconstrução individual."
              />

              <div className="patient-preview-explanation">
                <span className="label">EM LINGUAGEM MAIS SIMPLES</span>
                <p>{report.finding.patientExplanation}</p>
              </div>

              <footer>
                Prévia local · ainda não compartilhada.
              </footer>
            </div>
          )}
        </section>
      )}

      {publishError && (
        <div className="publish-error" role="alert">
          {publishError}
        </div>
      )}

      {presentation.completion.share && shareUrl ? (
        <section className="share-box share-box-v2">
          <div className="share-ready-heading">
            <span aria-hidden="true">✓</span>
            <div>
              <strong>Link pronto</strong>
              <small>Compartilhamento sintético temporário</small>
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
          <small>Este link expira em {demoShareTtlLabel()}.</small>
        </section>
      ) : (
        <div className="publish-zone publish-zone-v3">
          <div>
            <strong>Compartilhar</strong>
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
