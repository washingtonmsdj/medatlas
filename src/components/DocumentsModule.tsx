import type { VisualReport } from '../domain/types'
import { deriveReportPresentation } from '../domain/report-presentation'
import {
  DEMO_CONSTRAINTS,
  demoTextFormatLabel,
  formatDemoTextLimit,
} from '../product/constraints'
import { AnatomyFocusPreview } from './AnatomyFocusPreview'

interface Props {
  report: VisualReport
  onStartImport: () => void
  onOpenAtlas: () => void
}

export function DocumentsModule({
  report,
  onStartImport,
  onOpenAtlas,
}: Props) {
  const presentation = deriveReportPresentation(report)
  const documentSteps = presentation.steps.slice(0, 2)

  return (
    <section className="documents-module documents-module-v2 module-v3">
      <div className="documents-hero documents-hero-v2 workspace-hero-v3">
        <div className="module-hero-copy">
          <span className="section-kicker">DOCUMENTOS CLÍNICOS · ENTRADA LOCAL</span>
          <h2>Entrada local de laudos sintéticos</h2>
          <p>
            O navegador aceita apenas texto demonstrativo dentro do limite
            definido pelo produto. OCR, PDF e imagem permanecem bloqueados até
            existir pipeline seguro e auditável.
          </p>
        </div>

        <button className="primary" type="button" onClick={onStartImport}>
          Importar texto sintético
        </button>
      </div>

      <section className="document-pipeline report-step-rail document-step-rail-v3" aria-label="Pipeline do documento atual">
        {documentSteps.map((step, index) => (
          <article className={step.state} key={step.id}>
            <span>{step.done ? '✓' : index + 1}</span>
            <div>
              <strong>{step.id === 'source' ? 'Entrada' : 'Anatomia'}</strong>
              <small>{step.detail}</small>
            </div>
          </article>
        ))}
      </section>

      <section className="documents-anatomy-live anatomy-showcase-v3">
        <div className="documents-anatomy-live-copy anatomy-showcase-copy-v3">
          <span className="section-kicker">DOCUMENTO → ANATOMIA 3D</span>
          <h2>O conceito confirmado no texto aparece em geometria real.</h2>
          <p>
            O documento continua sendo a fonte clínica; o 3D representa apenas
            a referência FMA/BodyParts3D confirmada para a versão atual do
            texto.
          </p>
          <div className="anatomy-context-meta-v3">
            <span>
              <small>Entrada</small>
              <strong>{presentation.source.label}</strong>
            </span>
            <span>
              <small>Anatomia</small>
              <strong>{presentation.anatomy.label}</strong>
            </span>
          </div>
        </div>

        <AnatomyFocusPreview
          conceptId={report.finding.atlasConceptId || undefined}
          label={report.finding.anatomicalStructure}
          atlasRef={report.finding.atlasRef}
          eyebrow="REFERÊNCIA EXTRAÍDA · HUMAN ATLAS"
          contextMode="system"
          reviewRequired={report.finding.anatomyReviewRequired}
          onOpenAtlas={onOpenAtlas}
        />
      </section>

      <div className="documents-grid documents-grid-v2 document-capability-grid-v3">
        <article className="document-status-card">
          <span className="label">DOCUMENTO ATUAL</span>
          <strong>{presentation.source.label}</strong>
          <p>{presentation.source.detail}</p>
          <div className="document-card-meta">
            <span>Origem</span>
            <b>local / sintética</b>
          </div>
        </article>

        <article className="document-status-card">
          <span className="label">ANATOMIA</span>
          <strong>{presentation.anatomy.label}</strong>
          <p>{presentation.anatomy.detail}</p>
          <div className="document-card-meta">
            <span>Revisão</span>
            <b>
              {report.finding.anatomyReviewRequired
                ? 'obrigatória'
                : 'confirmada'}
            </b>
          </div>
        </article>

        <article className="document-status-card">
          <span className="label">FORMATOS ATIVOS</span>
          <strong>{demoTextFormatLabel()}</strong>
          <p>
            Leitura local até {formatDemoTextLimit()}, somente com conteúdo
            fictício.
          </p>
          <div className="document-format-list">
            {DEMO_CONSTRAINTS.localText.extensions.map((extension) => (
              <span key={extension}>{extension.slice(1).toUpperCase()}</span>
            ))}
          </div>
        </article>

        <article className="locked-format locked-format-v2">
          <div className="locked-format-heading">
            <span className="label">PDF / IMAGEM</span>
            <i aria-hidden="true">⌁</i>
          </div>
          <strong>Ainda bloqueado</strong>
          <p>
            OCR, PDF e imagem entram apenas quando validação de formato,
            segurança, rastreabilidade e revisão humana estiverem
            implementadas.
          </p>
          <div className="document-format-list locked">
            <span>PDF</span>
            <span>JPG</span>
            <span>PNG</span>
          </div>
        </article>
      </div>

      <section className="documents-boundary-note module-boundary-v3">
        <span aria-hidden="true">i</span>
        <div>
          <strong>Capacidade real, não interface simulada.</strong>
          <p>
            O módulo exibe apenas formatos que o runtime atual consegue ler e
            validar com segurança. Capacidades futuras permanecem
            explicitamente bloqueadas.
          </p>
        </div>
      </section>
    </section>
  )
}
