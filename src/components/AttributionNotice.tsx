interface Props {
  compact?: boolean
}

export function AttributionNotice({ compact = false }: Props) {
  return (
    <section
      className={compact ? 'attribution-notice compact' : 'attribution-notice'}
      aria-label="Fontes e licenças da anatomia"
    >
      <div>
        <span className="section-kicker">FONTES E LICENÇAS</span>
        <strong>BodyParts3D 4.0 · anatomia de referência</strong>
      </div>

      <p>
        BodyParts3D, © The Database Center for Life Science licensed under CC
        Attribution 4.0 International. A integração 3D do MedAtlas deriva do
        Human Atlas, cujo código upstream é licenciado sob MIT.
      </p>

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

      {!compact && (
        <small>
          O MedAtlas adapta a apresentação, tradução, empacotamento e fluxo de
          uso. O modelo permanece anatomia humana de referência e não
          reconstrução do paciente.
        </small>
      )}
    </section>
  )
}
