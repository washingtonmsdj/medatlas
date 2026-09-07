import { useCallback, useEffect, useState } from 'react'
import type {
  ClinicalReportViewStat,
  ClinicalRepository,
  ClinicalUsageSummary,
} from '../data/clinical-repository'

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
    <section className="analytics-module">
      <div className="analytics-hero">
        <div className="module-hero-copy">
          <span className="section-kicker">ANALYTICS · USO OBSERVÁVEL</span>
          <h2>Visualizações dos relatórios compartilhados</h2>
          <p>
            No demo, estes números vêm dos links realmente criados e abertos
            neste navegador. Em produção, a mesma superfície será alimentada
            por <code>report_shares</code> e <code>audit_events</code>.
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
        <div className="analytics-error" role="alert">
          <strong>Não foi possível carregar as métricas locais.</strong>
          <span>
            Nenhum dado clínico é inferido quando a leitura de analytics falha.
          </span>
        </div>
      ) : (
        <>
          <div
            className="analytics-metrics"
            aria-label="Resumo de visualizações do demo"
            aria-busy={status === 'loading'}
          >
            <article>
              <span className="label">RELATÓRIOS COMPARTILHADOS</span>
              <strong>{summary.publishedReports}</strong>
              <small>relatórios únicos ainda presentes no demo</small>
            </article>
            <article>
              <span className="label">LINKS ATIVOS</span>
              <strong>{summary.activeShares}</strong>
              <small>expiram automaticamente em 30 minutos</small>
            </article>
            <article>
              <span className="label">VISUALIZAÇÕES REAIS</span>
              <strong>{summary.shareViews}</strong>
              <small>aberturas registradas pelos links locais</small>
            </article>
            <article>
              <span className="label">RELATÓRIOS VISUALIZADOS</span>
              <strong>{summary.viewedReports}</strong>
              <small>{formatDate(summary.lastViewedAt)}</small>
            </article>
          </div>

          <section className="analytics-report-card">
            <header>
              <div>
                <span className="section-kicker">POR RELATÓRIO</span>
                <strong>Histórico de visualizações disponível agora</strong>
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
                    Esta tela passará a mostrar somente eventos realmente
                    observados neste demo.
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
                  <div
                    className="analytics-report-row"
                    key={report.reportId}
                  >
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

          <section className="analytics-boundary">
            <span aria-hidden="true">i</span>
            <div>
              <strong>Sem tracking paralelo</strong>
              <p>
                O contrato de produção não cria uma tabela extra de analytics.
                Visualizações são derivadas do evento auditável
                <code> report.share_viewed </code>
                e links de <code>report_shares</code>, sempre dentro do tenant.
              </p>
            </div>
          </section>
        </>
      )}
    </section>
  )
}
