import { useState, type ChangeEvent } from 'react'
import type { AnatomySuggestion } from '../clinical/anatomy-suggestions'
import {
  REPORT_EXAMPLES,
  type ReportExample,
} from '../clinical/demo-scenarios'

const MAX_LOCAL_TEXT_BYTES = 64 * 1024
const ALLOWED_TEXT_EXTENSIONS = ['.txt', '.md']

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

function hasAllowedTextExtension(filename: string) {
  const normalized = filename.toLowerCase()
  return ALLOWED_TEXT_EXTENSIONS.some((extension) =>
    normalized.endsWith(extension),
  )
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
  const [fileError, setFileError] = useState('')
  const [fileName, setFileName] = useState('')

  const importLocalText = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''

    if (!file) return

    setFileError('')
    setFileName('')

    if (!hasAllowedTextExtension(file.name)) {
      setFileError(
        'Formato não suportado neste MVP. Use somente arquivo sintético .txt ou .md.',
      )
      return
    }

    if (file.size > MAX_LOCAL_TEXT_BYTES) {
      setFileError(
        'Arquivo muito grande para a demonstração local. Limite: 64 KB.',
      )
      return
    }

    try {
      const text = await file.text()

      if (text.trim().length < 3) {
        setFileError('O arquivo não contém texto suficiente para análise.')
        return
      }

      onSourceTextChange(text)
      setFileName(file.name)
    } catch {
      setFileError('Não foi possível ler o arquivo local.')
    }
  }

  return (
    <section className="intake-card">
      <div className="intake-heading">
        <div>
          <span className="section-kicker">1 · LAUDO / RELATÓRIO</span>
          <h2>Localizar anatomia mencionada</h2>
          <p>
            Cole, edite ou importe um texto sintético. O MedAtlas procura
            referências que existem no atlas e apresenta sugestões para
            confirmação humana.
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

        <label className="file-import-button">
          <input
            aria-label="Importar laudo de texto sintético"
            type="file"
            accept=".txt,.md,text/plain,text/markdown"
            onChange={(event) => void importLocalText(event)}
          />
          Importar .txt/.md
        </label>
      </div>

      <div className="local-file-note">
        <span>Processamento local</span>
        <p>
          O arquivo não é enviado para servidor. Use somente conteúdo fictício
          neste MVP.
        </p>
        {fileName && <strong>{fileName}</strong>}
      </div>

      <textarea
        className="intake-editor"
        aria-label="Texto do laudo ou relatório"
        value={sourceText}
        onChange={(event) => {
          setFileName('')
          setFileError('')
          onSourceTextChange(event.target.value)
        }}
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

      {(error || fileError) && (
        <div className="intake-error" role="alert">
          {fileError || error}
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
