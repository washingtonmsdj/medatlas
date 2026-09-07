import type { VisualReport } from '../domain/types'

interface Props {
  report: VisualReport
  onOpenReport: () => void
  onOpenAtlas: () => void
}

function reportStatus(report: VisualReport) {
  if (!report.finding.sourceText.trim()) return 'Novo relatório'
  if (report.finding.anatomyReviewRequired) return 'Anatomia pendente'
  if (report.finding.explanationReviewRequired) return 'Revisão pendente'
  if (report.status === 'published') return 'Compartilhado'
  return 'Pronto para publicar'
}

export function PatientsModule({
  report,
  onOpenReport,
  onOpenAtlas,
}: Props) {
  const anatomy = report.finding.atlasConceptId
    ? report.finding.anatomicalStructure
    : 'Nenhuma estrutura confirmada'

  return (
    <section className="patients-module">
      <div className="patients-hero">
        <div>
          <span className="section-kicker">PACIENTE · DEMONSTRAÇÃO</span>
          <h2>Contexto sintético do relatório atual</h2>
          <p>
            Esta tela não é um prontuário. Ela apenas organiza o contexto
            fictício já presente no relatório em trabalho.
          </p>
        </div>
        <span className="synthetic-chip">dados fictícios</span>
      </div>

      <div className="patient-workspace-grid">
        <article className="patient-profile-card">
          <span className="label">PACIENTE</span>
          <strong>{report.patient.displayName}</strong>
          <p>{report.patient.age} anos · perfil exclusivamente demonstrativo</p>

          <dl>
            <div>
              <dt>Persistência</dt>
              <dd>Somente estado local do MVP</dd>
            </div>
            <div>
              <dt>Identificadores reais</dt>
              <dd>Não permitidos</dd>
            </div>
          </dl>
        </article>

        <article className="patient-current-report">
          <span className="label">RELATÓRIO VISUAL ATUAL</span>
          <strong>{report.title}</strong>
          <p>{reportStatus(report)}</p>

          <div className="patient-report-facts">
            <div>
              <span>Anatomia</span>
              <b>{anatomy}</b>
            </div>
            <div>
              <span>FMA</span>
              <b>{report.finding.atlasConceptId || '—'}</b>
            </div>
            <div>
              <span>Explicação</span>
              <b>
                {report.finding.patientExplanation.trim()
                  ? report.finding.explanationReviewRequired
                    ? 'revisão pendente'
                    : 'revisada'
                  : 'não criada'}
              </b>
            </div>
          </div>

          <div className="patient-workspace-actions">
            <button className="primary" type="button" onClick={onOpenReport}>
              Abrir relatório visual
            </button>
            <button type="button" onClick={onOpenAtlas}>
              Ver anatomia no Atlas
            </button>
          </div>
        </article>
      </div>

      <div className="patient-production-boundary">
        <strong>O que entra somente com backend de produção</strong>
        <span>cadastro real</span>
        <span>busca de pacientes</span>
        <span>histórico persistente</span>
        <span>controle por organização</span>
        <span>auditoria e consentimentos</span>
      </div>
    </section>
  )
}
