import { useMemo, useState } from 'react'
import { patientShareUrl } from '../app-url'
import type { VisualReport } from '../domain/types'
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
  const [previewOpen, setPreviewOpen] = useState(false)

  const shareUrl =
    report.status === 'published' && report.shareSlug
      ? patientShareUrl(report.shareSlug)
      : ''

  const canWorkOnExplanation =
    !report.finding.anatomyReviewRequired &&
    Boolean(report.finding.atlasConceptId)

  const hasExplanation = Boolean(
    report.finding.patientExplanation.trim(),
  )

  const reviewComplete =
    canWorkOnExplanation &&
    hasExplanation &&
    !report.finding.explanationReviewRequired

  const workflowState = useMemo(
    () => [
      {
        label: 'Anatomia',
        detail: canWorkOnExplanation ? 'confirmada' : 'pendente',
        done: canWorkOnExplanation,
      },
      {
        label: 'Explicação',
        detail: hasExplanation ? 'rascunho pronto' : 'aguardando',
        done: hasExplanation,
      },
      {
        label: 'Revisão',
        detail: reviewComplete ? 'aprovada' : 'obrigatória',
        done: reviewComplete,
      },
    ],
    [canWorkOnExplanation, hasExplanation, reviewComplete],
  )

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
    <aside className="report-card report-card-v2">
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
          {report.status === 'published'
            ? 'Publicado'
            : reviewComplete
              ? 'Pronto para publicar'
              : 'Revisão pendente'}
        </span>
      </header>

      <div className="composer-progress" aria-label="Status da preparação">
        {workflowState.map((item, index) => (
          <div className={item.done ? 'done' : ''} key={item.label}>
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
            {generatingDraft ? 'Gerando…' : 'Gerar rascunho educacional'}
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
            placeholder="Gere um rascunho educacional ou escreva a explicação manualmente."
            disabled={!canWorkOnExplanation}
          />
          <div className="explanation-editor-meta">
            <span>
              {report.finding.patientExplanation.length.toLocaleString('pt-BR')}{' '}
              caracteres
            </span>
            <span>
              {report.finding.explanationReviewRequired
                ? 'edição exige nova revisão'
                : 'versão revisada'}
            </span>
          </div>
        </div>

        <div className="provenance-panel">
          <span aria-hidden="true">↳</span>
          <div>
            <strong>Origem e responsabilidade</strong>
            <p>
              {report.finding.explanationProvenance.origin === 'deterministic'
                ? `Gerador ${report.finding.explanationProvenance.generatorId} · v${report.finding.explanationProvenance.generatorVersion}. `
                : ''}
              O conteúdo só pode ser compartilhado depois da aprovação explícita
              do profissional.
            </p>
          </div>
        </div>
      </section>

      {report.finding.explanationReviewRequired ? (
        <section className="review-required-box review-gate-v2">
          <div className="review-gate-heading">
            <span aria-hidden="true">!</span>
            <div>
              <strong>Revisão clínica obrigatória</strong>
              <small>Gate humano antes de qualquer compartilhamento</small>
            </div>
          </div>
          <p>
            Confirme que a anatomia e a explicação correspondem ao que você
            pretende comunicar ao paciente.
          </p>
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
              ? 'Fechar preview do paciente'
              : 'Pré-visualizar experiência do paciente'}
          </button>

          {previewOpen && (
            <div
              className="patient-preview-card patient-preview-card-live"
              role="region"
              aria-label="Preview do paciente"
            >
              <div className="patient-preview-live-heading">
                <span>PREVIEW · NÃO PUBLICADO</span>
                <strong>Experiência visual que o paciente receberá</strong>
                <small>
                  O mesmo Human Atlas do relatório, em uma interface simplificada.
                </small>
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
                Esta prévia permanece local e não publicada. A versão compartilhada
                só é liberada depois da revisão clínica explícita.
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

      {report.status === 'published' && report.shareSlug ? (
        <section className="share-box share-box-v2">
          <div className="share-ready-heading">
            <span aria-hidden="true">✓</span>
            <div>
              <strong>Link de demonstração gerado</strong>
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
              Abrir visão do paciente
            </button>
          </div>
          <small>
            MVP sem backend: token opaco aleatório, armazenamento local
            exclusivamente sintético e expiração automática em 30 minutos.
          </small>
        </section>
      ) : (
        <div className="publish-zone">
          <div>
            <strong>Entrega ao paciente</strong>
            <span>
              {report.finding.anatomyReviewRequired
                ? 'A anatomia precisa ser confirmada.'
                : report.finding.explanationReviewRequired
                  ? 'A explicação precisa de revisão explícita.'
                  : 'Todos os gates estão concluídos.'}
            </span>
          </div>
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
        </div>
      )}
    </aside>
  )
}
