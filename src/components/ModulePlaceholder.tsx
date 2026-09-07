interface Props {
  title: string
  description: string
  status: string
  items: string[]
}

export function ModulePlaceholder({
  title,
  description,
  status,
  items,
}: Props) {
  return (
    <section className="module-placeholder">
      <div className="module-placeholder-icon" aria-hidden="true">
        M
      </div>
      <span className="section-kicker">MÓDULO PREPARADO</span>
      <h2>{title}</h2>
      <p>{description}</p>
      <span className="module-status">{status}</span>

      <div className="module-roadmap">
        {items.map((item, index) => (
          <div key={item}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <p>{item}</p>
          </div>
        ))}
      </div>

      <small>
        Esta tela não simula recursos que ainda não têm persistência e
        autorização comprovadas.
      </small>
    </section>
  )
}
