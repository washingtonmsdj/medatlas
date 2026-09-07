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

  return (
    <section className="documents-module">
      <div className="documents-hero">
        <div>
          <span className="section-kicker">DOCUMENTOS CLÍNICOS · DEMO</span>
          <h2>Entrada local de laudos sintéticos</h2>
          <p>
            Nesta fase, o MedAtlas trabalha somente com texto fictício lido no
            navegador. Nenhum arquivo é enviado para servidor.
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

      <div className="documents-grid">
        <article>
          <span className="label">DOCUMENTO ATUAL</span>
          <strong>
            {sourceLength > 0
              ? `${sourceLength} caracteres`
              : 'Nenhum texto carregado'}
          </strong>
          <p>
            O conteúdo atual pertence somente ao relatório em trabalho neste
            navegador.
          </p>
        </article>

        <article>
          <span className="label">ANATOMIA</span>
          <strong>{anatomyStatus}</strong>
          <p>
            Uma nova entrada textual reabre a confirmação anatômica antes de
            qualquer explicação ou publicação.
          </p>
        </article>

        <article>
          <span className="label">FORMATOS ATIVOS</span>
          <strong>.txt · .md</strong>
          <p>Leitura local, limite de 64 KB e uso exclusivamente sintético.</p>
        </article>

        <article className="locked-format">
          <span className="label">PDF / IMAGEM</span>
          <strong>Ainda bloqueado</strong>
          <p>
            OCR, PDF e imagem só entram quando houver um pipeline seguro e
            testado. O MVP não simula esse processamento.
          </p>
        </article>
      </div>
    </section>
  )
}
