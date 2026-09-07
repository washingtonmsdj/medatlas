interface Props {
  selected: string
}

export function AtlasViewport({ selected }: Props) {
  return (
    <section className="atlas-card" aria-label="Prévia do Atlas 3D">
      <div className="atlas-toolbar">
        <span className="live-dot" />
        <span>Atlas anatômico</span>
        <span className="atlas-badge">P0 · integração 3D</span>
      </div>

      <div className="atlas-stage">
        <div className="body-silhouette" aria-hidden="true">
          <span className="head" />
          <span className="torso" />
          <span className="arm arm-left" />
          <span className="arm arm-right" />
          <span className="leg leg-left" />
          <span className="leg leg-right" />
          <span className="lumbar-glow" />
        </div>

        <div className="structure-label">
          <strong>{selected}</strong>
          <span>estrutura vinculada ao relatório</span>
        </div>
      </div>

      <div className="atlas-actions">
        <button type="button">Isolar</button>
        <button type="button">Camadas</button>
        <button type="button">Vista anterior</button>
        <button type="button">Explodir</button>
      </div>

      <p className="integration-note">
        Este viewport é o shell do produto. O renderer Three.js/BodyParts3D entra no próximo checkpoint P0.
      </p>
    </section>
  )
}
