import type { ReactNode } from 'react'

interface Props {
  eyebrow: string
  title: string
  description: string
  actions?: ReactNode
  meta?: ReactNode
  className?: string
}

export function WorkspacePageHeader({
  eyebrow,
  title,
  description,
  actions,
  meta,
  className = '',
}: Props) {
  return (
    <header className={`workspace-page-header ${className}`.trim()}>
      <div className="workspace-page-header-copy">
        <span className="section-kicker">{eyebrow}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      {(meta || actions) && (
        <div className="workspace-page-header-tools">
          {meta && <div className="workspace-page-header-meta">{meta}</div>}
          {actions && (
            <div className="workspace-page-header-actions">{actions}</div>
          )}
        </div>
      )}
    </header>
  )
}
