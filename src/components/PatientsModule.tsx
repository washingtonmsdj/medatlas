import type { VisualReport } from '../domain/types'
import { AnatomyFocusPreview } from './AnatomyFocusPreview'

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

  const milestones = [
    Boolean(report.finding.sourceText.trim()),
    Boolean(report.finding.atlasConceptId) &&
      !report.finding.anatomyReviewRequired,
    Boolean(report.finding.patientExplanation.trim()) &&
      !report.finding.explanationReviewRequired,
    report.status === 'published',
  ]
  const completed = milestones.filter(Boolean).length

  return (
    <section className="patients-module patients-module-v2">
      <div className="patients-hero patients-hero-v2">
        <div className="module-hero-copy">
          <span className="section-kicker">PACIENTES · CONTEXTO ATUAL</span>
          <h2>Contexto sintético do relatório atual</h2>
          <p>
            Uma visão organizada do paciente fictício e do relatório em
            andamento. Não é prontuário e não persiste cadastro real.
          </p>
        </div>

        <div className="module-hero-status">
          <span className="synthetic-chip">dados fictícios</span>
          <strong>{completed}/4</strong>
          <small>etapas do relatório concluídas</small>
        </div>
      </div>

      <div className="patient-workspace-grid patient-workspace-grid-v2">
        <article className="patient-profile-card patient-profile-card-v2">
          <div className="patient-profile-heading">
            <span className="patient-avatar" aria-hidden="true">
              {report.patient.displayName
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part[0])
                .join('')
                .toUpperCase()}
            </span>
            <div>
              <span className="label">PACIENTE DEMONSTRAÇÃO</span>
              <strong>{report.patient.displayName}</strong>
              <p>{report.patient.age} anos · perfil fictício</p>
            </div>
          </div>

          <dl className="patient-profile-meta">
            <div>
              <dt>Escopo</dt>
              <dd>Relatório atual</dd>
            </div>
            <div>
              <dt>Persistência</dt>
              <dd>Somente local</dd>
            </div>
            <div>
              <dt>Dados reais</dt>
              <dd>Bloqueados</dd>
            </div>
          </dl>

          <div className="patient-profile-note">
            <span aria-hidden="true">i</span>
            <p>
              O módulo ganhará busca, histórico e cadastro somente quando o
              backend clínico e o isolamento por organização estiverem ativos.
            </p>
          </div>
        </article>

        <article className="patient-current-report patient-current-report-v2">
          <header>
            <div>
              <span className="label">RELATÓRIO VISUAL ATUAL</span>
              <strong>{report.title}</strong>
            </div>
            <span
              className={
                report.status === 'published'
                  ? 'report-state-chip published'
                  : 'report-state-chip'
              }
            >
              {reportStatus(report)}
            </span>
          </header>

          <div className="patient-report-progress" aria-label="Progresso do relatório">
            {[
              'Laudo',
              'Anatomia',
              'Explicação',
              'Paciente',
            ].map((label, index) => (
              <span className={milestones[index] ? 'done' : ''} key={label}>
                <i aria-hidden="true">{milestones[index] ? '✓' : index + 1}</i>
                {label}
              </span>
            ))}
          </div>

          <div className="patient-report-facts patient-report-facts-v2">
            <div>
              <span>Anatomia</span>
              <b>{anatomy}</b>
              <small>{report.finding.atlasConceptId || 'sem FMA confirmado'}</small>
            </div>
            <div>
              <span>Explicação</span>
              <b>
                {report.finding.patientExplanation.trim()
                  ? report.finding.explanationReviewRequired
                    ? 'Revisão pendente'
                    : 'Revisada'
                  : 'Não criada'}
              </b>
              <small>
                {report.finding.patientExplanation.trim()
                  ? `${report.finding.patientExplanation.length.toLocaleString('pt-BR')} caracteres`
                  : 'aguardando conteúdo'}
              </small>
            </div>
            <div>
              <span>Compartilhamento</span>
              <b>{report.status === 'published' ? 'Ativo' : 'Não publicado'}</b>
              <small>
                {report.status === 'published'
                  ? 'link demo temporário'
                  : 'gate humano preservado'}
              </small>
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

      <section className="patient-anatomy-live">
        <div className="patient-anatomy-live-copy">
          <span className="section-kicker">DIFERENCIAL MEDATLAS · 3D REAL</span>
          <h2>A anatomia ligada a este paciente, agora no próprio contexto.</h2>
          <p>
            Esta área usa o mesmo Human Atlas do relatório e do link do paciente.
            Não é ilustração, thumbnail ou modelo genérico paralelo.
          </p>
        </div>

        <AnatomyFocusPreview
          conceptId={report.finding.atlasConceptId || undefined}
          label={report.finding.anatomicalStructure}
          atlasRef={report.finding.atlasRef}
          eyebrow="PRÉVIA VISUAL DO PACIENTE · HUMAN ATLAS"
          appearance="patient"
          contextMode="system"
          reviewRequired={report.finding.anatomyReviewRequired}
          onOpenAtlas={onOpenAtlas}
          description="A mesma referência anatômica acompanha o fluxo do profissional ao paciente. O modelo representa anatomia humana de referência, não uma reconstrução individual."
        />
      </section>

      <section className="patient-production-boundary patient-production-boundary-v2">
        <div>
          <span className="section-kicker">FRONTEIRA DE PRODUÇÃO</span>
          <strong>Recursos bloqueados até existir backend clínico real</strong>
          <p>
            O MVP não simula funcionalidades que exigem identidade, persistência
            ou autorização por organização.
          </p>
        </div>
        <div className="production-boundary-list">
          {[
            'cadastro real',
            'busca de pacientes',
            'histórico persistente',
            'isolamento por organização',
            'auditoria e consentimentos',
          ].map((item) => (
            <span key={item}>
              <i aria-hidden="true">⌁</i>
              {item}
            </span>
          ))}
        </div>
      </section>
    </section>
  )
}
