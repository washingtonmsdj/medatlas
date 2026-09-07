import type { VisualReport } from '../domain/types'

interface Props {
  report: VisualReport
  onPublish: () => void
}

export function ReportComposer({ report, onPublish }: Props) {
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
        <p>{report.finding.patientExplanation}</p>
      </div>

      <div className="safety-box">
        <strong>Revisão clínica obrigatória</strong>
        <span>{report.finding.clinicianNote}</span>
      </div>

      {report.status === 'published' && report.shareSlug ? (
        <div className="share-box">
          <span>Link privado gerado</span>
          <code>medatlas.app/p/{report.shareSlug}</code>
          <button className="primary" type="button">
            Copiar link
          </button>
        </div>
      ) : (
        <button className="primary full" type="button" onClick={onPublish}>
          Aprovar e gerar link do paciente
        </button>
      )}
    </aside>
  )
}
