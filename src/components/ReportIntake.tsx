import type { AnatomySuggestion } from '../clinical/anatomy-suggestions'
import {
  REPORT_EXAMPLES,
  type ReportExample,
} from '../clinical/demo-scenarios'

interface Props {
  sourceText: string
  analyzing: boolean
  anatomyReviewRequired: boolean
  error: string
  suggestions: AnatomySuggestion[]
  onSourceTextChange: (value: string) => void
  onLoadExample: (example: ReportExample) => void
  onAnalyze: () => void | Promise<void>
  onConfirmSuggestion: (suggestion: AnatomySuggestion) => void
}

export function ReportIntake({
  sourceText,
  analyzing,
  anatomyReviewRequired,
  error,
  suggestions,
  onSourceTextChange,
  onLoadExample,
  onAnalyze,
  onConfirmSuggestion,
}: Props) {
  return (
    <section className="intake-card">
      <div className="intake-heading">
        <div>
          <span className="section-kicker">1 · LAUDO / RELATÓRIO</span>
          <h2>Localizar anatomia mencionada</h2>
          <p>
            Cole ou edite um trecho. O MedAtlas procura referências que
            existem no atlas e apresenta sugestões para confirmação humana.
          </p>
        </div>
        <span className="intake-safety-badge">sem diagnóstico automático</span>
      </div>

      <div className="example-row" aria-label="Exemplos sintéticos">
        <span>Testar cenário:</span>
        {REPORT_EXAMPLES.map((example) => (
          <button
            key={example.id}
            type="button"
            onClick={() => onLoadExample(example)}
          >
            {example.label}
          </button>
        ))}
      </div>

      <textarea
        className="intake-editor"
        aria-label="Texto do laudo ou relatório"
        value={sourceText}
        onChange={(event) => onSourceTextChange(event.target.value)}
        rows={5}
        placeholder="Ex.: Protusão discal posterior em L4-L5..."
      />

      {anatomyReviewRequired && (
        <div className="anatomy-reconfirm-note">
          <strong>Reconfirmação anatômica necessária</strong>
          <span>
            O texto mudou. O último 3D pode continuar visível para comparação,
            mas precisa ser confirmado novamente antes de gerar ou publicar.
          </span>
        </div>
      )}

      <div className="intake-actions">
        <button
          className="primary"
          type="button"
          onClick={() => void onAnalyze()}
          disabled={analyzing || sourceText.trim().length < 3}
        >
          {analyzing ? 'Analisando anatomia…' : 'Sugerir estruturas'}
        </button>
        <span>
          A sugestão não altera o relatório até o profissional confirmar.
        </span>
      </div>

      {error && (
        <div className="intake-error" role="alert">
          {error}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="suggestion-list">
          <div className="suggestion-list-heading">
            <strong>Estruturas encontradas no texto</strong>
            <span>{suggestions.length} sugestão(ões)</span>
          </div>

          {suggestions.map((suggestion) => (
            <article
              className="suggestion-item"
              key={suggestion.concept.id}
            >
              <div className="suggestion-confidence">
                <span
                  className={
                    suggestion.confidence === 'high'
                      ? 'confidence-high'
                      : 'confidence-medium'
                  }
                />
                <small>
                  {suggestion.confidence === 'high'
                    ? 'correspondência direta'
                    : 'nome do atlas'}
                </small>
              </div>

              <div className="suggestion-copy">
                <strong>{suggestion.displayName}</strong>
                <span>
                  {suggestion.concept.name} · {suggestion.concept.id}
                </span>
                <small>
                  encontrado por “{suggestion.evidence}”
                </small>
              </div>

              <button
                type="button"
                onClick={() => onConfirmSuggestion(suggestion)}
              >
                Confirmar estrutura
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
