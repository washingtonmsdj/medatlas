import type { VisualReport } from '../domain/types'
import { PilotChecklist } from './PilotChecklist'

interface Props {
  report: VisualReport
  organizationName: string
  workspaceName: string
  unitName?: string
  onNewReport: () => void
  onOpenReport: () => void
  onOpenAtlas: () => void
}

const syntheticMetrics = [
  { value: '8', label: 'consultas hoje', delta: '+2 vs. ontem', tone: 'blue' },
  { value: '3', label: 'relatórios para revisar', delta: 'prioridade clínica', tone: 'amber' },
  { value: '12', label: 'links visualizados', delta: '+71% esta semana', tone: 'violet' },
  { value: '2', label: 'novos exames', delta: 'aguardando triagem', tone: 'mint' },
] as const

const activity = [
  ['Maria Santos', 'Joelho direito', 'Paciente visualizou', 'há 12 min'],
  ['Carlos Lima', 'Coração · ecocardiograma', 'Relatório publicado', 'há 38 min'],
  ['Ana Souza', 'Ombro direito', 'Revisão necessária', 'há 1 h'],
] as const

export function Overview({
  report,
  organizationName,
  workspaceName,
  unitName,
  onNewReport,
  onOpenReport,
  onOpenAtlas,
}: Props) {
  const hasAnatomy =
    Boolean(report.finding.atlasConceptId) &&
    !report.finding.anatomyReviewRequired

  const reviewLabel = !report.finding.sourceText.trim()
    ? 'Novo relatório'
    : report.finding.anatomyReviewRequired
      ? 'Confirmar anatomia'
      : report.finding.explanationReviewRequired
        ? 'Revisar explicação'
        : report.status === 'published'
          ? 'Publicado'
          : 'Pronto para publicar'

  const anatomyLabel = !report.finding.atlasConceptId
    ? 'Anatomia não selecionada'
    : report.finding.anatomyReviewRequired
      ? 'Reconfirmação necessária'
      : report.finding.anatomicalStructure

  const completedSteps = [
    Boolean(report.finding.sourceText.trim()),
    hasAnatomy,
    hasAnatomy && !report.finding.explanationReviewRequired,
    report.status === 'published',
  ].filter(Boolean).length

  return (
    <section className="overview-module overview-saas-v2">
      <div className="overview-welcome">
        <div>
          <span className="section-kicker">
            {organizationName.toUpperCase()} · {workspaceName.toUpperCase()}
            {unitName ? ` · ${unitName.toUpperCase()}` : ''}
          </span>
          <h2>Bom dia, Dr. Carlos.</h2>
          <p>
            Continue os atendimentos e transforme informação clínica em uma
            explicação visual revisada para cada paciente.
          </p>
        </div>

        <div className="overview-actions overview-actions-premium">
          <button className="primary" type="button" onClick={onNewReport}>
            <span aria-hidden="true">＋</span>
            Novo relatório visual
          </button>
          <button type="button" onClick={onOpenAtlas}>
            Explorar Atlas 3D
          </button>
        </div>
      </div>

      <div className="overview-metrics premium-metrics" aria-label="Resumo sintético do dia">
        {syntheticMetrics.map((metric) => (
          <article className={`metric-card metric-${metric.tone}`} key={metric.label}>
            <span className="metric-icon" aria-hidden="true" />
            <div>
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
              <small>{metric.delta}</small>
            </div>
          </article>
        ))}
      </div>

      <div className="overview-command-grid">
        <article className="continue-care-card">
          <div className="continue-care-heading">
            <div>
              <span className="section-kicker">CONTINUAR ATENDIMENTO</span>
              <h2>{report.patient.displayName}</h2>
              <p>{report.title}</p>
            </div>
            <span className="care-status">{reviewLabel}</span>
          </div>

          <div className="continue-care-body">
            <div className="anatomy-preview-orbit" aria-hidden="true">
              <span className="orbit orbit-one" />
              <span className="orbit orbit-two" />
              <span className="anatomy-preview-core">3D</span>
            </div>

            <div className="continue-care-copy">
              <span>Anatomia do relatório</span>
              <strong>{anatomyLabel}</strong>
              <small>
                {hasAnatomy
                  ? `${report.finding.atlasConceptId} · referência BodyParts3D`
                  : 'A confirmação humana continua obrigatória antes da publicação.'}
              </small>

              <div
                className="care-progress"
                role="progressbar"
                aria-label="Progresso do relatório"
                aria-valuemin={0}
                aria-valuemax={4}
                aria-valuenow={completedSteps}
              >
                <span className={report.finding.sourceText.trim() ? 'done' : ''} />
                <span className={hasAnatomy ? 'done' : ''} />
                <span className={!report.finding.explanationReviewRequired && hasAnatomy ? 'done' : ''} />
                <span className={report.status === 'published' ? 'done' : ''} />
              </div>

              <button className="primary" type="button" onClick={onOpenReport}>
                Continuar relatório
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </article>

        <aside className="work-queue-card">
          <div className="work-queue-heading">
            <div>
              <span className="section-kicker">FILA CLÍNICA</span>
              <h2>Precisa da sua atenção</h2>
            </div>
            <span className="queue-count">3</span>
          </div>

          <button type="button" className="queue-item" onClick={onOpenReport}>
            <span className="queue-avatar">JS</span>
            <span>
              <strong>João Silva</strong>
              <small>Ressonância lombar · revisão</small>
            </span>
            <b>→</b>
          </button>
          <button type="button" className="queue-item" onClick={onOpenAtlas}>
            <span className="queue-avatar">MF</span>
            <span>
              <strong>Marina Freitas</strong>
              <small>Joelho · anatomia pendente</small>
            </span>
            <b>→</b>
          </button>
          <button type="button" className="queue-item" onClick={onNewReport}>
            <span className="queue-avatar">RC</span>
            <span>
              <strong>Rafael Costa</strong>
              <small>Novo exame recebido</small>
            </span>
            <b>→</b>
          </button>
        </aside>
      </div>

      <div className="overview-flow premium-flow">
        <div className="overview-flow-heading">
          <div>
            <span className="section-kicker">O MOMENTO WOW DO MEDATLAS</span>
            <h2>Do laudo ao entendimento, em um único fluxo.</h2>
            <p>
              A automação prepara. O profissional confirma e continua sendo a
              autoridade clínica de publicação.
            </p>
          </div>
          <span className="overview-status">Human Atlas · engine canônico</span>
        </div>

        <div className="premium-flow-steps">
          {[
            ['01', 'Laudo', 'Importe ou cole o texto clínico.'],
            ['02', 'Anatomia 3D', 'Localize e confirme estruturas reais.'],
            ['03', 'Explicação', 'Edite um rascunho em linguagem clara.'],
            ['04', 'Revisão', 'Aprove explicitamente o conteúdo.'],
            ['05', 'Paciente', 'Compartilhe uma experiência visual segura.'],
          ].map(([number, title, description], index) => (
            <article key={number}>
              <span>{number}</span>
              <div>
                <strong>{title}</strong>
                <p>{description}</p>
              </div>
              {index < 4 && <b aria-hidden="true">→</b>}
            </article>
          ))}
        </div>
      </div>

      <div className="overview-lower-grid">
        <section className="recent-activity-card">
          <div className="overview-flow-heading">
            <div>
              <span className="section-kicker">ATIVIDADE RECENTE · DEMO</span>
              <h2>O que aconteceu na clínica</h2>
            </div>
            <small>Dados sintéticos</small>
          </div>

          <div className="recent-activity-list">
            {activity.map(([patient, subject, status, time]) => (
              <article key={`${patient}-${subject}`}>
                <span className="activity-dot" />
                <div>
                  <strong>{patient}</strong>
                  <small>{subject}</small>
                </div>
                <span>{status}</span>
                <time>{time}</time>
              </article>
            ))}
          </div>
        </section>

        <aside className="product-position-card">
          <span className="section-kicker">MEDATLAS PARA CLÍNICAS</span>
          <h2>Uma plataforma. Diferentes papéis.</h2>
          <p>
            Clínica, profissional, equipe e paciente usam experiências próprias
            sobre a mesma organização e o mesmo registro clínico autorizado.
          </p>
          <div>
            <span>✓ organização multi-tenant</span>
            <span>✓ workspace do profissional</span>
            <span>✓ experiência simplificada do paciente</span>
            <span>✓ revisão humana antes do compartilhamento</span>
          </div>
        </aside>
      </div>

      <PilotChecklist report={report} />
    </section>
  )
}
