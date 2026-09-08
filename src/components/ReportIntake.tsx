import { useMemo, useState, type ChangeEvent } from 'react'
import type { AnatomySuggestion } from '../clinical/anatomy-suggestions'
import {
  REPORT_EXAMPLES,
  type ReportExample,
} from '../clinical/demo-scenarios'
import { DEMO_CONSTRAINTS, formatDemoTextLimit } from '../product/constraints'

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
  return DEMO_CONSTRAINTS.localText.extensions.some((extension) =>
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

  const sourceState = useMemo(() => {
    if (analyzing) {
      return {
        label: 'Analisando',
        detail: 'Comparando o texto com conceitos anatômicos permitidos.',
        tone: 'working',
      }
    }

    if (suggestions.length > 0) {
      return {
        label: `${suggestions.length} correspondência${suggestions.length === 1 ? '' : 's'}`,
        detail: 'Sugestões prontas para confirmação humana.',
        tone: 'ready',
      }
    }

    if (sourceText.trim().length >= 3) {
      return {
        label: 'Texto pronto',
        detail: 'Nenhuma anatomia será aplicada sem confirmação.',
        tone: 'ready',
      }
    }

    return {
      label: 'Aguardando laudo',
      detail: 'Cole texto ou carregue um exemplo sintético.',
      tone: 'idle',
    }
  }, [analyzing, sourceText, suggestions.length])

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

    if (file.size > DEMO_CONSTRAINTS.localText.maxBytes) {
      setFileError(
        `Arquivo muito grande para a demonstração local. Limite: ${formatDemoTextLimit()}.`,
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
    <section className="intake-card intake-card-v2">
      <div className="intake-heading intake-heading-v2">
        <div>
          <span className="section-kicker">FONTE CLÍNICA</span>
          <h2>Localizar anatomia mencionada</h2>
          <p>
            Texto primeiro. Sugestão depois. Confirmação humana sempre.
          </p>
        </div>

        <div className="intake-status-cluster">
          <span className="intake-safety-badge">sem diagnóstico automático</span>
          <span
            className={`intake-source-status ${sourceState.tone}`}
            role="status"
            aria-live="polite"
          >
            <i aria-hidden="true" />
            <span>
              <strong>{sourceState.label}</strong>
              <small>{sourceState.detail}</small>
            </span>
          </span>
        </div>
      </div>

      <div className="intake-example-strip">
        <div className="example-row" aria-label="Exemplos sintéticos">
          <span>Cenários rápidos</span>
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

        <label className="file-import-button">
          <input
            aria-label="Importar laudo de texto sintético"
            type="file"
            accept=".txt,.md,text/plain,text/markdown"
            onChange={(event) => void importLocalText(event)}
          />
          <span aria-hidden="true">↑</span>
          Importar texto
        </label>
      </div>

      <div className="intake-editor-shell">
        <div className="intake-editor-toolbar">
          <span>Laudo / relatório</span>
          <div>
            {fileName && <strong>{fileName}</strong>}
            <small>{sourceText.length.toLocaleString('pt-BR')} caracteres</small>
          </div>
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
          rows={7}
          placeholder="Ex.: Protusão discal posterior em L4-L5..."
        />

        <div className="intake-editor-foot">
          <span>
            <i aria-hidden="true">◉</i>
            Processamento local · demonstração sintética
          </span>
          <small>Máx. {formatDemoTextLimit()} em {DEMO_CONSTRAINTS.localText.extensions.join('/')} neste MVP</small>
        </div>
      </div>

      {anatomyReviewRequired && (
        <div className="anatomy-reconfirm-note">
          <strong>Reconfirmação anatômica necessária</strong>
          <span>
            O texto mudou. O último 3D continua visível apenas para comparação
            até uma estrutura ser confirmada novamente.
          </span>
        </div>
      )}

      <div className="intake-actions intake-actions-v2">
        <button
          className="primary"
          type="button"
          onClick={() => void onAnalyze()}
          disabled={analyzing || sourceText.trim().length < 3}
        >
          {analyzing ? 'Analisando anatomia…' : 'Sugerir estruturas'}
        </button>
        <span>
          Nada é aplicado automaticamente ao relatório.
        </span>
      </div>

      {(error || fileError) && (
        <div className="intake-error" role="alert">
          {fileError || error}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="suggestion-list suggestion-list-v2">
          <div className="suggestion-list-heading">
            <div>
              <span className="section-kicker">RESULTADO DA TRIAGEM</span>
              <strong>Confirme a referência visual correta</strong>
            </div>
            <span>{suggestions.length} sugestão(ões)</span>
          </div>

          {suggestions.map((suggestion, index) => {
            const highConfidence = suggestion.confidence === 'high'

            return (
              <article
                className={`suggestion-item ${index === 0 ? 'suggestion-primary' : ''}`}
                key={suggestion.concept.id}
              >
                <div
                  className={`suggestion-rank ${highConfidence ? 'high' : 'medium'}`}
                  aria-label={
                    highConfidence
                      ? 'Alta confiança: correspondência direta'
                      : 'Confiança moderada: nome do atlas'
                  }
                >
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <small>
                    {highConfidence ? 'Alta confiança' : 'Confiança moderada'}
                  </small>
                </div>

                <div className="suggestion-copy">
                  <div>
                    <strong>{suggestion.displayName}</strong>
                    <code>{suggestion.concept.id}</code>
                  </div>
                  <span>{suggestion.concept.name}</span>
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
            )
          })}

          <p className="suggestion-safety-note">
            A confiança indica apenas a força da correspondência textual com o
            atlas. Não representa certeza clínica, diagnóstico ou relevância do
            achado.
          </p>
        </div>
      )}
    </section>
  )
}
