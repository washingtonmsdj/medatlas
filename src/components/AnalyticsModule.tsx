import { useCallback, useEffect, useState } from 'react'
import type {
  ClinicalReportViewStat,
  ClinicalRepository,
  ClinicalUsageSummary,
} from '../data/clinical-repository'
import { demoShareTtlLabel } from '../product/constraints'

interface Props {
  repository: ClinicalRepository
}

const EMPTY_SUMMARY: ClinicalUsageSummary = {
  publishedReports: 0,
  sharesCreated: 0,
  activeShares: 0,
  shareViews: 0,
  viewedReports: 0,
}

function formatDate(value?: string) {
  if (!value) return 'Nenhuma visualização ainda'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Data indisponível'

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

export function AnalyticsModule({ repository }: Props) {
  const [summary, setSummary] =
    useState<ClinicalUsageSummary>(EMPTY_SUMMARY)
  const [reports, setReports] = useState<ClinicalReportViewStat[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  )

  const load = useCallback(async () => {
    setStatus('loading')

    try {
      const [nextSummary, nextReports] = await Promise.all([
        repository.getUsageSummary(),
        repository.getReportViewStats(),
      ])

      setSummary(nextSummary)
      setReports(nextReports)
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [repository])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <section className="analytics-module module-v3">
      <div className="analytics-hero workspace-hero-v3">
        <div className="module-hero-copy">
          <span className="section-kicker">ANALYTICS · USO OBSERVÁVEL</span>
          <h2>Visualizações dos relatórios compartilhados</h2>
          <p>
            Métricas vêm somente de compartilhamentos realmente criados e
            abertos no repositório atual. A interface não inventa sessões,
            pacientes ou eventos para preencher o dashboard.
          </p>
        </div>

        <button
          type="button"
          className="analytics-refresh"
          onClick={() => void load()}
          disabled={status === 'loading'}
        >
          {status === 'loading' ? 'Atualizando…' : 'Atualizar métricas'}
        </button>
      </div>

      {status === 'error' ? (
        <div className="analytics-error analytics-error-v3" role="alert">
          <div>
            <strong>Não foi possível carregar as métricas locais.</strong>
            <span>
              Nenhum dado é inferido quando a leitura de analytics falha.
            </span>
          </div>
          <button type="button" onClick={() => void load()}>
            Tentar novamente
          </button>
        </div>
      ) : (
        <>
          <div
            className={`analytics-metrics analytics-metrics-v3 ${status === 'loading' ? 'is-loading' : ''}`}
            aria-label="Resumo de visualizações do demo"
            aria-busy={status === 'loading'}
          >
            <article>
              <span className="label">RELATÓRIOS COMPARTILHADOS</span>
              <strong>{summary.publishedReports}</strong>
              <small>relatórios únicos presentes no repositório atual</small>
            </article>
            <article>
              <span className="label">LINKS ATIVOS</span>
              <strong>{summary.activeShares}</strong>
              <small>expiração do demo: {demoShareTtlLabel()}</small>
            </article>
            <article>
              <span className="label">VISUALIZAÇÕES REAIS</span>
              <strong>{summary.shareViews}</strong>
              <small>aberturas observadas pelos links locais</small>
            </article>
            <article>
              <span className="label">RELATÓRIOS VISUALIZADOS</span>
              <strong>{summary.viewedReports}</strong>
              <small>{formatDate(summary.lastViewedAt)}</small>
            </article>
          </div>

          <section className="analytics-report-card analytics-report-card-v3">
            <header>
              <div>
                <span className="section-kicker">POR RELATÓRIO</span>
                <strong>Histórico observável de compartilhamento</strong>
              </div>
              <span>{reports.length} relatório(s)</span>
            </header>

            {reports.length === 0 ? (
              <div className="analytics-empty">
                <span aria-hidden="true">↗</span>
                <div>
                  <strong>Ainda não há compartilhamentos para medir.</strong>
                  <p>
                    Publique um relatório visual e abra o link do paciente.
                    Apenas eventos realmente observados aparecerão aqui.
                  </p>
                </div>
              </div>
            ) : (
              <div className="analytics-report-list">
                <div className="analytics-report-row analytics-report-head">
                  <span>Relatório</span>
                  <span>Links</span>
                  <span>Visualizações</span>
                  <span>Última visualização</span>
                </div>

                {reports.map((report) => (
                  <div className="analytics-report-row" key={report.reportId}>
                    <div>
                      <strong>{report.reportTitle}</strong>
                      <small>versão {report.reportVersion}</small>
                    </div>
                    <span>{report.sharesCreated}</span>
                    <span className="analytics-view-count">
                      {report.viewCount}
                    </span>
                    <time>{formatDate(report.lastViewedAt)}</time>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="analytics-boundary module-boundary-v3">
            <span aria-hidden="true">i</span>
            <div>
              <strong>Sem tracking paralelo</strong>
              <p>
                Visualizações são derivadas da trilha de compartilhamento e
                auditoria do repositório clínico. O frontend não envia
                telemetria clínica para um sistema paralelo.
              </p>
            </div>
          </section>
        </>
      )}
    </section>
  )
}
