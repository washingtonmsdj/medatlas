import type { VisualReport } from '../domain/types'
import { AnatomyFocusPreview } from './AnatomyFocusPreview'
import { PilotChecklist } from './PilotChecklist'

interface Props {
  report: VisualReport
  organizationName: string
  workspaceName: string
  unitName?: string
  professionalDisplayName: string
  onNewReport: () => void
  onOpenReport: () => void
  onOpenAtlas: () => void
}

const syntheticMetrics = [
  {
    value: '8',
    label: 'consultas hoje',
    delta: '+2 vs. ontem',
    tone: 'blue',
    icon: '＋',
  },
  {
    value: '3',
    label: 'relatórios para revisar',
    delta: 'prioridade clínica',
    tone: 'amber',
    icon: '✓',
  },
  {
    value: '12',
    label: 'links visualizados',
    delta: '+71% esta semana',
    tone: 'violet',
    icon: '↗',
  },
  {
    value: '2',
    label: 'novos exames',
    delta: 'aguardando triagem',
    tone: 'mint',
    icon: '⌕',
  },
] as const

const activity = [
  ['Maria Santos', 'Joelho direito', 'Paciente visualizou', 'há 12 min'],
  ['Carlos Lima', 'Coração · ecocardiograma', 'Relatório publicado', 'há 38 min'],
  ['Ana Souza', 'Ombro direito', 'Revisão necessária', 'há 1 h'],
] as const

const atlasProofs = [
  ['~2.234', 'peças anatômicas', 'inventário Human Atlas'],
  ['FMA', 'conceitos reais', 'referência BodyParts3D'],
  ['3D', 'interativo', 'girar, focar e identificar'],
  ['1', 'engine canônico', 'clínica + paciente + explorer'],
] as const

export function Overview({
  report,
  organizationName,
  workspaceName,
  unitName,
  professionalDisplayName,
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
    <section className="overview-module overview-saas-v2 overview-3d-first">
      <div className="overview-welcome">
        <div>
          <span className="section-kicker">
            {organizationName.toUpperCase()} · {workspaceName.toUpperCase()}
            {unitName ? ` · ${unitName.toUpperCase()}` : ''}
          </span>
          <h2>Bom dia, {professionalDisplayName}.</h2>
          <p>
            Seu workspace clínico agora coloca a anatomia 3D no centro do
            atendimento: visualize, confirme e explique sem sair do mesmo fluxo.
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

      <article className="continue-care-card overview-3d-hero">
        <div className="overview-3d-hero-heading">
          <div>
            <span className="overview-new-pill">
              <span aria-hidden="true">✦</span>
              NOVO · HUMAN ATLAS 3D
            </span>
            <span className="section-kicker">DIFERENCIAL MEDATLAS</span>
            <h2>O laudo deixa de ser só texto.</h2>
            <p>
              O profissional conecta o achado a uma estrutura anatômica real,
              revisa a explicação e entrega ao paciente uma experiência visual
              compreensível e auditável.
            </p>
          </div>
          <span className="care-status">{reviewLabel}</span>
        </div>

        <div className="overview-3d-hero-grid">
          <div className="overview-3d-stage-shell">
            <AnatomyFocusPreview
              conceptId={report.finding.atlasConceptId || undefined}
              label={report.finding.anatomicalStructure}
              atlasRef={report.finding.atlasRef}
              eyebrow="3D DO ATENDIMENTO · HUMAN ATLAS · MODELO DE REFERÊNCIA"
              contextMode="none"
              compact
              reviewRequired={report.finding.anatomyReviewRequired}
              onOpenAtlas={onOpenAtlas}
              description="Geometria real do Human Atlas/BodyParts3D integrada ao atendimento. Anatomia de referência — não reconstrução específica do paciente."
            />
          </div>

          <div className="overview-3d-story">
            <div className="overview-3d-story-copy">
              <span className="section-kicker">ATENDIMENTO EM FOCO</span>
              <h3>{report.patient.displayName}</h3>
              <p>{report.title}</p>
            </div>

            <div className="overview-3d-current-anatomy">
              <span>Anatomia do relatório</span>
              <strong>{anatomyLabel}</strong>
              <small>
                {hasAnatomy
                  ? `${report.finding.atlasConceptId} · referência BodyParts3D`
                  : 'A confirmação humana continua obrigatória antes da publicação.'}
              </small>
            </div>

            <div className="overview-3d-proof-grid" aria-label="Diferenciais do Atlas 3D">
              {atlasProofs.map(([value, label, detail]) => (
                <div key={label}>
                  <strong>{value}</strong>
                  <span>{label}</span>
                  <small>{detail}</small>
                </div>
              ))}
            </div>

            <div className="overview-3d-progress-copy">
              <div>
                <span>Progresso do relatório</span>
                <strong>{completedSteps}/4 etapas concluídas</strong>
              </div>
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
            </div>

            <div className="overview-3d-hero-actions">
              <button className="primary" type="button" onClick={onOpenReport}>
                Continuar relatório
                <span aria-hidden="true">→</span>
              </button>
              <button type="button" onClick={onOpenAtlas}>
                Abrir Atlas completo
              </button>
            </div>

            <small className="overview-3d-safety">
              Revisão clínica continua obrigatória antes de qualquer
              compartilhamento com o paciente.
            </small>
          </div>
        </div>
      </article>

      <div className="overview-metrics premium-metrics" aria-label="Resumo sintético do dia">
        {syntheticMetrics.map((metric) => (
          <article className={`metric-card metric-${metric.tone}`} key={metric.label}>
            <span className="metric-icon" aria-hidden="true">{metric.icon}</span>
            <div>
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
              <small>{metric.delta}</small>
            </div>
          </article>
        ))}
      </div>

      <div className="overview-command-grid overview-command-grid-v5">
        <section className="premium-flow">
          <div className="overview-flow-heading">
            <div>
              <span className="section-kicker">FLUXO VISUAL CLÍNICO</span>
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
        </section>

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

          <div className="queue-3d-note">
            <span aria-hidden="true">3D</span>
            <div>
              <strong>Contexto anatômico sempre disponível</strong>
              <small>
                Abra o Atlas sem abandonar o fluxo clínico atual.
              </small>
            </div>
          </div>
        </aside>
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

        <aside className="product-position-card product-position-card-v5">
          <span className="section-kicker">MEDATLAS PARA CLÍNICAS</span>
          <h2>O 3D não é um módulo isolado. É a linguagem visual do produto.</h2>
          <p>
            Clínica, profissional, equipe e paciente usam experiências próprias
            sobre a mesma organização, o mesmo relatório revisado e o mesmo
            Human Atlas de referência.
          </p>
          <div>
            <span>✓ 3D integrado ao atendimento</span>
            <span>✓ um único engine anatômico</span>
            <span>✓ experiência simplificada do paciente</span>
            <span>✓ revisão humana antes do compartilhamento</span>
          </div>
          <button type="button" onClick={onOpenAtlas}>
            Conhecer o Atlas 3D
            <span aria-hidden="true">→</span>
          </button>
        </aside>
      </div>

      <PilotChecklist report={report} />
    </section>
  )
}
