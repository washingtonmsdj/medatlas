import type { VisualReport } from '../domain/types'
import { deriveReportPresentation } from '../domain/report-presentation'
import { AnatomyFocusPreview } from './AnatomyFocusPreview'

interface Props {
  report: VisualReport
  onOpenReport: () => void
  onNewReport: () => void
  onOpenAtlas: () => void
}

export function ConsultationsModule({
  report,
  onOpenReport,
  onNewReport,
  onOpenAtlas,
}: Props) {
  const presentation = deriveReportPresentation(report)

  return (
    <section className="consultations-module consultations-module-v2 module-v3">
      <div className="consultations-hero consultations-hero-v2 workspace-hero-v3">
        <div className="module-hero-copy">
          <span className="section-kicker">CONSULTA · WORKFLOW VISUAL</span>
          <h2>Sessão clínica visual em andamento</h2>
          <p>
            Esta superfície acompanha o relatório atual durante a conversa
            clínica. Agenda, prontuário e histórico não são simulados enquanto
            a persistência de produção estiver desativada.
          </p>
        </div>

        <div className="consultation-progress-summary workspace-hero-badge">
          <strong className="consultation-score">
            {presentation.completed}/{presentation.total}
          </strong>
          <span>
            <small>Próxima etapa</small>
            <b>{presentation.currentStep?.label ?? 'Fluxo concluído'}</b>
          </span>
        </div>
      </div>

      <div
        className="consultation-timeline consultation-timeline-v2 report-step-rail consultation-step-rail-v3"
        aria-label="Progresso da consulta visual"
      >
        {presentation.steps.map((step, index) => (
          <article key={step.id} className={step.state}>
            <span>{step.done ? '✓' : index + 1}</span>
            <div>
              <strong>{step.shortLabel}</strong>
              <p>{step.detail}</p>
            </div>
            <i aria-hidden="true" />
          </article>
        ))}
      </div>

      <section className="consultation-anatomy-live anatomy-showcase-v3">
        <div className="consultation-anatomy-live-copy anatomy-showcase-copy-v3">
          <span className="section-kicker">CONSULTA VISUAL · ANATOMIA AO VIVO</span>
          <h2>O 3D permanece visível durante a sessão.</h2>
          <p>
            A referência anatômica acompanha o workflow para apoiar a
            explicação visual, sem alterar o relatório quando uma peça é apenas
            inspecionada.
          </p>
          <div className="anatomy-context-meta-v3">
            <span>
              <small>Paciente</small>
              <strong>{report.patient.displayName}</strong>
            </span>
            <span>
              <small>Próxima ação</small>
              <strong>{presentation.currentStep?.shortLabel ?? 'Concluído'}</strong>
            </span>
          </div>
        </div>

        <AnatomyFocusPreview
          conceptId={report.finding.atlasConceptId || undefined}
          label={report.finding.anatomicalStructure}
          atlasRef={report.finding.atlasRef}
          eyebrow="FOCO DA CONSULTA · HUMAN ATLAS"
          contextMode="system"
          reviewRequired={report.finding.anatomyReviewRequired}
          onOpenAtlas={onOpenAtlas}
        />
      </section>

      <div className="consultation-summary consultation-summary-v2 status-facts-v3">
        <article>
          <span className="label">PACIENTE</span>
          <strong>{report.patient.displayName}</strong>
          <p>{report.patient.age} anos · contexto fictício</p>
        </article>

        <article>
          <span className="label">ANATOMIA DE REFERÊNCIA</span>
          <strong>{presentation.anatomy.label}</strong>
          <p>{presentation.anatomy.detail}</p>
        </article>

        <article>
          <span className="label">PUBLICAÇÃO</span>
          <strong>{presentation.sharing.label}</strong>
          <p>{presentation.sharing.detail}</p>
        </article>
      </div>

      <div className="consultation-actions consultation-actions-v2 module-action-bar-v3">
        <div>
          <strong>Continue exatamente de onde parou</strong>
          <span>
            O estado exibido aqui é derivado do mesmo relatório usado pelo
            Clinical Studio.
          </span>
        </div>
        <div>
          <button className="primary" type="button" onClick={onOpenReport}>
            Continuar relatório atual
          </button>
          <button type="button" onClick={onNewReport}>
            Iniciar nova sessão sintética
          </button>
        </div>
      </div>
    </section>
  )
}
