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

  return (
    <section className="documents-module documents-module-v2 module-v3 mvp-surface">
      <div className="documents-hero documents-hero-v2 workspace-hero-v3 mvp-page-hero">
        <div className="module-hero-copy">
          <span className="section-kicker">EXAMES</span>
          <h2>Exames</h2>
          <p>Cole ou importe um texto e confirme a anatomia.</p>
        </div>

        <button className="primary" type="button" onClick={onStartImport}>
          Importar texto
        </button>
      </div>

      <section className="documents-anatomy-live anatomy-showcase-v3">
        <div className="documents-anatomy-live-copy anatomy-showcase-copy-v3">
          <span className="section-kicker">ANATOMIA ENCONTRADA</span>
          <h2>{presentation.anatomy.label}</h2>
          <p>{presentation.source.detail}</p>
        </div>

        <AnatomyFocusPreview
          conceptId={report.finding.atlasConceptId || undefined}
          label={report.finding.anatomicalStructure}
          atlasRef={report.finding.atlasRef}
          eyebrow="HUMAN ATLAS 3D"
          contextMode="system"
          reviewRequired={report.finding.anatomyReviewRequired}
          onOpenAtlas={onOpenAtlas}
        />
      </section>

      <div className="documents-grid documents-grid-v2 document-capability-grid-v3 mvp-compact-grid">
        <article className="document-status-card">
          <span className="label">TEXTO ATUAL</span>
          <strong>{presentation.source.label}</strong>
          <p>{presentation.source.detail}</p>
        </article>

        <article className="document-status-card">
          <span className="label">FORMATOS</span>
          <strong>{demoTextFormatLabel()}</strong>
          <p>Até {formatDemoTextLimit()} por arquivo.</p>
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
          <strong>Em breve</strong>
          <p>Esta versão do MVP aceita texto local.</p>
        </article>
      </div>
    </section>
  )
}
