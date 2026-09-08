import type { VisualReport } from '../domain/types'
import { deriveReportPresentation } from '../domain/report-presentation'
import { AnatomyFocusPreview } from './AnatomyFocusPreview'

interface Props {
  report: VisualReport
  onOpenReport: () => void
  onOpenAtlas: () => void
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function PatientsModule({
  report,
  onOpenReport,
  onOpenAtlas,
}: Props) {
  const presentation = deriveReportPresentation(report)

  return (
    <section className="patients-module patients-module-v2 module-v3">
      <div className="patients-hero patients-hero-v2 workspace-hero-v3">
        <div className="module-hero-copy">
          <span className="section-kicker">PACIENTES · CONTEXTO ATUAL</span>
          <h2>Contexto sintético do relatório atual</h2>
          <p>
            A tela reúne identidade demonstrativa, estado clínico visual e
            anatomia de referência sem simular prontuário, busca ou histórico
            que ainda dependem de backend seguro.
          </p>
        </div>

        <div className="workspace-hero-badge">
          <span className="synthetic-chip">dados fictícios</span>
          <strong>{presentation.progressPercent}%</strong>
          <small>{presentation.statusLabel}</small>
        </div>
      </div>

      <div className="patient-workspace-grid patient-workspace-grid-v2 workspace-context-grid">
        <article className="patient-profile-card patient-profile-card-v2 workspace-panel">
          <div className="patient-profile-heading">
            <span className="patient-avatar" aria-hidden="true">
              {initials(report.patient.displayName)}
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
              <dt>Estado</dt>
              <dd>{presentation.statusLabel}</dd>
            </div>
            <div>
              <dt>Persistência</dt>
              <dd>Somente local</dd>
            </div>
          </dl>

          <div className="patient-profile-note">
            <span aria-hidden="true">i</span>
            <p>
              Nenhuma lista adicional é inventada no demo. Busca, histórico e
              cadastro entram somente quando identidade, tenant e RLS estiverem
              ativos.
            </p>
          </div>
        </article>

        <article className="patient-current-report patient-current-report-v2 workspace-panel">
          <header>
            <div>
              <span className="label">RELATÓRIO VISUAL ATUAL</span>
              <strong>{report.title}</strong>
            </div>
            <span
              className={
                presentation.sharing.state === 'published'
                  ? 'report-state-chip published'
                  : 'report-state-chip'
              }
            >
              {presentation.statusLabel}
            </span>
          </header>

          <div className="patient-report-progress report-step-rail" aria-label="Progresso do relatório">
            {presentation.steps.map((step, index) => (
              <span className={step.state} key={step.id}>
                <i aria-hidden="true">{step.done ? '✓' : index + 1}</i>
                {step.shortLabel}
              </span>
            ))}
          </div>

          <div className="patient-report-facts patient-report-facts-v2 status-facts-v3">
            <div>
              <span>Anatomia</span>
              <b>{presentation.anatomy.label}</b>
              <small>{presentation.anatomy.detail}</small>
            </div>
            <div>
              <span>Explicação</span>
              <b>{presentation.explanation.label}</b>
              <small>{presentation.explanation.detail}</small>
            </div>
            <div>
              <span>Compartilhamento</span>
              <b>{presentation.sharing.label}</b>
              <small>{presentation.sharing.detail}</small>
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

      <section className="patient-anatomy-live anatomy-showcase-v3">
        <div className="patient-anatomy-live-copy anatomy-showcase-copy-v3">
          <span className="section-kicker">DIFERENCIAL MEDATLAS · 3D REAL</span>
          <h2>A anatomia do relatório acompanha o contexto do paciente.</h2>
          <p>
            O preview usa exatamente o mesmo engine e a mesma referência do
            Clinical Studio e do link compartilhado, com apresentação adaptada
            para o paciente.
          </p>
          <div className="anatomy-context-meta-v3">
            <span>
              <small>Referência</small>
              <strong>{presentation.anatomy.label}</strong>
            </span>
            <span>
              <small>Estado</small>
              <strong>{presentation.statusLabel}</strong>
            </span>
          </div>
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

      <section className="patient-production-boundary patient-production-boundary-v2 module-boundary-v3">
        <div>
          <span className="section-kicker">FRONTEIRA DE PRODUÇÃO</span>
          <strong>Sem funcionalidades falsas antes do backend clínico.</strong>
          <p>
            O MVP expõe apenas o que consegue provar localmente e mantém
            operações dependentes de identidade/persistência bloqueadas.
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
