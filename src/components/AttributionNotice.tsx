interface Props {
  compact?: boolean
}

const licenseLinks = (
  <div className="attribution-links">
    <a
      href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html"
      target="_blank"
      rel="noreferrer"
    >
      Licença BodyParts3D
    </a>
    <a
      href="https://creativecommons.org/licenses/by/4.0/"
      target="_blank"
      rel="noreferrer"
    >
      CC BY 4.0
    </a>
    <a
      href="https://github.com/ashemag/human-atlas"
      target="_blank"
      rel="noreferrer"
    >
      Human Atlas
    </a>
  </div>
)

const attributionCopy = (
  <p>
    BodyParts3D, © The Database Center for Life Science licensed under CC
    Attribution 4.0 International. A integração 3D do MedAtlas deriva do
    Human Atlas, cujo código upstream é licenciado sob MIT.
  </p>
)

export function AttributionNotice({ compact = false }: Props) {
  if (compact) {
    return (
      <details
        className="attribution-notice compact attribution-disclosure"
        aria-label="Fontes e licenças da anatomia"
      >
        <summary>Fontes e licenças</summary>
        <div>
          <strong>BodyParts3D 4.0 · anatomia humana de referência</strong>
          {attributionCopy}
          {licenseLinks}
        </div>
      </details>
    )
  }

  return (
    <section
      className="attribution-notice"
      aria-label="Fontes e licenças da anatomia"
    >
      <div>
        <span className="section-kicker">FONTES E LICENÇAS</span>
        <strong>BodyParts3D 4.0 · anatomia humana de referência</strong>
      </div>

      {attributionCopy}
      {licenseLinks}

      <small>
        O MedAtlas adapta a apresentação, tradução, empacotamento e fluxo de
        uso. O modelo permanece anatomia humana de referência e não
        reconstrução do paciente.
      </small>
    </section>
  )
}
