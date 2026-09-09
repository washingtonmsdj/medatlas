import { useCallback, useEffect, useState } from 'react'
import type {
  ClinicalReportViewStat,
  ClinicalRepository,
  ClinicalUsageSummary,
} from '../data/clinical-repository'
import { demoShareTtlLabel } from '../product/constraints'
import { WorkspacePageHeader } from './WorkspacePageHeader'

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
  if (!value) return 'Sem visualizações'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

export function AnalyticsModule({ repository }: Props) {
  const [summary, setSummary] = useState<ClinicalUsageSummary>(EMPTY_SUMMARY)
  const [reports, setReports] = useState<ClinicalReportViewStat[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

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
    <section className="analytics-module module-v3 mvp-surface">
      <WorkspacePageHeader
        eyebrow="ANALYTICS"
        title="Desempenho dos relatórios"
        description="Aberturas, links ativos e alcance dos compartilhamentos."
        actions={
          <button
            type="button"
            className="analytics-refresh"
            onClick={() => void load()}
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Atualizando…' : 'Atualizar'}
          </button>
        }
      />

      {status === 'error' ? (
        <div className="analytics-error" role="alert">
          <div>
            <strong>Não foi possível carregar os dados.</strong>
          </div>
          <button type="button" onClick={() => void load()}>
            Tentar novamente
          </button>
        </div>
      ) : (
        <>
          <div
            className={`analytics-metrics ${status === 'loading' ? 'is-loading' : ''}`}
            aria-label="Resumo de visualizações dos relatórios"
            aria-busy={status === 'loading'}
          >
            <article>
              <span className="label">RELATÓRIOS</span>
              <strong>{summary.publishedReports}</strong>
              <small>compartilhados</small>
            </article>
            <article>
              <span className="label">LINKS ATIVOS</span>
              <strong>{summary.activeShares}</strong>
              <small>expiram em {demoShareTtlLabel()}</small>
            </article>
            <article>
              <span className="label">VISUALIZAÇÕES</span>
              <strong>{summary.shareViews}</strong>
              <small>aberturas registradas</small>
            </article>
            <article>
              <span className="label">COM VISUALIZAÇÃO</span>
              <strong>{summary.viewedReports}</strong>
              <small>Última abertura: {formatDate(summary.lastViewedAt)}</small>
            </article>
          </div>

          <section className="analytics-report-card">
            <header>
              <div>
                <span className="section-kicker">RELATÓRIOS</span>
                <strong>Visualizações por relatório</strong>
              </div>
              <span>{reports.length}</span>
            </header>

            {reports.length === 0 ? (
              <div className="analytics-empty">
                <span aria-hidden="true">↗</span>
                <div>
                  <strong>Nenhum relatório visualizado ainda.</strong>
                  <p>Compartilhe um relatório para começar.</p>
                </div>
              </div>
            ) : (
              <div className="analytics-report-list">
                <div className="analytics-report-row analytics-report-head">
                  <span>Relatório</span>
                  <span>Links</span>
                  <span>Visualizações</span>
                  <span>Última abertura</span>
                </div>
                {reports.map((report) => (
                  <div className="analytics-report-row" key={report.reportId}>
                    <div>
                      <strong>{report.reportTitle}</strong>
                      <small>versão {report.reportVersion}</small>
                    </div>
                    <span className="analytics-report-stat">
                      <small className="analytics-mobile-label">Links</small>
                      <b>{report.sharesCreated}</b>
                    </span>
                    <span className="analytics-report-stat analytics-view-count">
                      <small className="analytics-mobile-label">Visualizações</small>
                      <b>{report.viewCount}</b>
                    </span>
                    <time
                      className="analytics-report-time"
                      dateTime={report.lastViewedAt}
                    >
                      <small className="analytics-mobile-label">Última abertura</small>
                      <b>{formatDate(report.lastViewedAt)}</b>
                    </time>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </section>
  )
}
