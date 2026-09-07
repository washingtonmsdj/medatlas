import type { VisualReport } from '../domain/types'

interface Props {
  report: VisualReport
  onStartImport: () => void
}

export function DocumentsModule({
  report,
  onStartImport,
}: Props) {
  const sourceLength = report.finding.sourceText.trim().length
  const anatomyStatus = !report.finding.atlasConceptId
    ? 'Não confirmada'
    : report.finding.anatomyReviewRequired
      ? 'Reconfirmação pendente'
      : report.finding.anatomicalStructure

  const pipeline = [
    {
      label: 'Entrada',
      value: sourceLength > 0 ? 'Texto carregado' : 'Aguardando texto',
      done: sourceLength > 0,
    },
    {
      label: 'Triagem',
      value: report.finding.atlasConceptId ? 'Referência encontrada' : 'Não executada',
      done: Boolean(report.finding.atlasConceptId),
    },
    {
      label: 'Confirmação',
      value: anatomyStatus,
      done:
        Boolean(report.finding.atlasConceptId) &&
        !report.finding.anatomyReviewRequired,
    },
  ]

  return (
    <section className="documents-module documents-module-v2">
      <div className="documents-hero documents-hero-v2">
        <div className="module-hero-copy">
          <span className="section-kicker">DOCUMENTOS CLÍNICOS · ENTRADA LOCAL</span>
          <h2>Entrada local de laudos sintéticos</h2>
          <p>
            Texto fictício é processado somente no navegador. Formatos que
            exigem OCR ou pipeline documental seguro continuam bloqueados.
          </p>
        </div>

        <button
          className="primary"
          type="button"
          onClick={onStartImport}
        >
          Importar texto sintético
        </button>
      </div>

      <section className="document-pipeline" aria-label="Pipeline do documento atual">
        {pipeline.map((step, index) => (
          <article className={step.done ? 'done' : ''} key={step.label}>
            <span>{step.done ? '✓' : index + 1}</span>
            <div>
              <strong>{step.label}</strong>
              <small>{step.value}</small>
            </div>
          </article>
        ))}
      </section>

      <div className="documents-grid documents-grid-v2">
        <article className="document-status-card">
          <span className="label">DOCUMENTO ATUAL</span>
          <strong>
            {sourceLength > 0
              ? `${sourceLength.toLocaleString('pt-BR')} caracteres`
              : 'Nenhum texto carregado'}
          </strong>
          <p>
            Estado local do relatório em trabalho neste navegador.
          </p>
          <div className="document-card-meta">
            <span>Origem</span>
            <b>local / sintética</b>
          </div>
        </article>

        <article className="document-status-card">
          <span className="label">ANATOMIA</span>
          <strong>{anatomyStatus}</strong>
          <p>
            Alterar o texto reabre a confirmação anatômica antes da explicação.
          </p>
          <div className="document-card-meta">
            <span>Referência</span>
            <b>{report.finding.atlasConceptId || '—'}</b>
          </div>
        </article>

        <article className="document-status-card">
          <span className="label">FORMATOS ATIVOS</span>
          <strong>.txt · .md</strong>
          <p>Leitura local, até 64 KB e somente conteúdo fictício.</p>
          <div className="document-format-list">
            <span>TXT</span>
            <span>MD</span>
          </div>
        </article>

        <article className="locked-format locked-format-v2">
          <div className="locked-format-heading">
            <span className="label">PDF / IMAGEM</span>
            <i aria-hidden="true">⌁</i>
          </div>
          <strong>Ainda bloqueado</strong>
          <p>
            OCR, PDF e imagem só entram quando houver pipeline seguro,
            rastreável e testado. O MVP não simula esse processamento.
          </p>
          <div className="document-format-list locked">
            <span>PDF</span>
            <span>JPG</span>
            <span>PNG</span>
          </div>
        </article>
      </div>

      <section className="documents-boundary-note">
        <span aria-hidden="true">i</span>
        <div>
          <strong>Por que manter PDF e imagem bloqueados agora?</strong>
          <p>
            Extrair conteúdo clínico de arquivos exige validação de formato,
            limites, segurança, OCR e revisão humana. Ativar uma interface fake
            esconderia riscos que ainda não foram implementados.
          </p>
        </div>
      </section>
    </section>
  )
}
