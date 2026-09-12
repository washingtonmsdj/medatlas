import { useMemo, useState, type ChangeEvent } from 'react'
import {
  anatomySuggestionSourceToken,
  type AnatomySuggestion,
} from '../clinical/anatomy-suggestions'
import {
  REPORT_EXAMPLES,
  type ReportExample,
} from '../clinical/demo-scenarios'
import {
  DEMO_CONSTRAINTS,
  demoTextFormatLabel,
  formatDemoTextLimit,
  isDemoTextFilenameAllowed,
  validateDemoReportSource,
} from '../product/constraints'

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
  const [fileError, setFileError] = useState('')
  const [sourceTextError, setSourceTextError] = useState('')
  const [fileName, setFileName] = useState('')
  const sourceValidation = useMemo(
    () => validateDemoReportSource(sourceText),
    [sourceText],
  )
  const sourceToken = useMemo(
    () => anatomySuggestionSourceToken(sourceText),
    [sourceText],
  )
  const currentSuggestions = useMemo(
    () => suggestions.filter((suggestion) => suggestion.sourceToken === sourceToken),
    [sourceToken, suggestions],
  )

  const sourceState = useMemo(() => {
    if (analyzing) {
      return {
        label: 'Analisando',
        detail: 'Localizando estruturas anatômicas.',
        tone: 'working',
      }
    }

    if (sourceTextError) {
      return {
        label: 'Texto não aplicado',
        detail: `O limite do laudo é ${formatDemoTextLimit()}.`,
        tone: 'idle',
      }
    }

    if (currentSuggestions.length > 0) {
      return {
        label: `${currentSuggestions.length} correspondência${currentSuggestions.length === 1 ? '' : 's'}`,
        detail: 'Confirme a estrutura correta.',
        tone: 'ready',
      }
    }

    if (sourceValidation.ok) {
      return {
        label: 'Laudo pronto',
        detail: 'Pronto para localizar a anatomia.',
        tone: 'ready',
      }
    }

    return {
      label: 'Aguardando laudo',
      detail: 'Cole o texto ou importe um arquivo.',
      tone: 'idle',
    }
  }, [analyzing, currentSuggestions.length, sourceTextError, sourceValidation.ok])

  const importLocalText = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''

    if (!file) return

    setFileError('')
    setSourceTextError('')
    setFileName('')

    if (!isDemoTextFilenameAllowed(file.name)) {
      setFileError('Formato não suportado. Use um arquivo .txt ou .md.')
      return
    }

    if (file.size > DEMO_CONSTRAINTS.localText.maxBytes) {
      setFileError(`Arquivo acima do limite de ${formatDemoTextLimit()}.`)
      return
    }

    try {
      const text = await file.text()
      const validation = validateDemoReportSource(text)

      if (!validation.ok && validation.reason === 'too-short') {
        setFileError('O arquivo não contém texto suficiente para análise.')
        return
      }

      if (!validation.ok && validation.reason === 'too-large') {
        setFileError(`Arquivo acima do limite de ${formatDemoTextLimit()}.`)
        return
      }

      onSourceTextChange(text)
      setFileName(file.name)
    } catch {
      setFileError('Não foi possível ler o arquivo local.')
    }
  }

  const analyzeLabel = anatomyReviewRequired
    ? 'Encontrar anatomia'
    : 'Reanalisar laudo'

  return (
    <section className="intake-card">
      <div className="intake-heading">
        <div>
          <span className="section-kicker">LAUDO / EXAME</span>
          <h2>Adicionar laudo</h2>
          <p>Cole o texto do exame ou importe um arquivo TXT/MD.</p>
        </div>

        <div className="intake-status-cluster">
          <span className="intake-safety-badge">revisão obrigatória</span>
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
          <span>Exemplos</span>
          {REPORT_EXAMPLES.map((example) => (
            <button
              key={example.id}
              type="button"
              onClick={() => {
                setFileError('')
                setSourceTextError('')
                setFileName('')
                onLoadExample(example)
              }}
            >
              {example.label}
            </button>
          ))}
        </div>

        <label className="file-import-button">
          <input
            aria-label="Importar laudo de texto sintético em TXT ou MD"
            type="file"
            accept=".txt,.md,text/plain,text/markdown"
            onChange={(event) => void importLocalText(event)}
          />
          <span aria-hidden="true">↑</span>
          Importar TXT/MD
        </label>
      </div>

      <div className="intake-editor-shell">
        <div className="intake-editor-toolbar">
          <span>Texto do laudo</span>
          <div>
            {fileName && <strong>{fileName}</strong>}
            <small>
              {sourceValidation.bytes.toLocaleString('pt-BR')} bytes · limite{' '}
              {formatDemoTextLimit()}
            </small>
          </div>
        </div>

        <textarea
          className="intake-editor"
          aria-label="Texto do laudo ou relatório"
          value={sourceText}
          onChange={(event) => {
            const nextValue = event.target.value
            const validation = validateDemoReportSource(nextValue)

            setFileName('')
            setFileError('')

            if (!validation.ok && validation.reason === 'too-large') {
              setSourceTextError(
                `Texto acima do limite de ${formatDemoTextLimit()}.`,
              )
              return
            }

            setSourceTextError('')
            onSourceTextChange(nextValue)
          }}
          rows={7}
          placeholder="Ex.: Protusão discal posterior em L4-L5..."
        />

        <div className="intake-editor-foot">
          <span>
            <i aria-hidden="true">◉</i>
            Processado localmente
          </span>
          <small>
            {demoTextFormatLabel()} · até {formatDemoTextLimit()}
          </small>
        </div>
      </div>

      {anatomyReviewRequired && (
        <div className="anatomy-reconfirm-note">
          <strong>Confirme novamente a anatomia</strong>
          <span>
            O texto mudou. A estrutura anterior continua visível somente para
            comparação até uma nova confirmação.
          </span>
        </div>
      )}

      <div className="intake-actions">
        <button
          className={anatomyReviewRequired ? 'primary' : 'reanalyze'}
          type="button"
          onClick={() => void onAnalyze()}
          disabled={analyzing || !sourceValidation.ok || Boolean(sourceTextError)}
        >
          {analyzing ? 'Analisando…' : analyzeLabel}
        </button>
        <span>
          {anatomyReviewRequired
            ? 'Depois, confirme a estrutura correta no Atlas.'
            : 'Use apenas se precisar refazer a correspondência anatômica.'}
        </span>
      </div>

      {(error || fileError || sourceTextError) && (
        <div className="intake-error" role="alert">
          {sourceTextError || fileError || error}
        </div>
      )}

      {currentSuggestions.length > 0 && (
        <div className="suggestion-list">
          <div className="suggestion-list-heading">
            <div>
              <span className="section-kicker">ESTRUTURAS ENCONTRADAS</span>
              <strong>Confirme a anatomia do laudo</strong>
            </div>
            <span>{currentSuggestions.length} opção(ões)</span>
          </div>

          {currentSuggestions.map((suggestion, index) => {
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
                  </div>
                  <span>{suggestion.concept.name}</span>
                  <small>correspondência: “{suggestion.evidence}”</small>
                </div>

                <button
                  type="button"
                  onClick={() => onConfirmSuggestion(suggestion)}
                >
                  Usar estrutura
                </button>
              </article>
            )
          })}

          <p className="suggestion-safety-note">
            A correspondência ajuda a localizar a anatomia e precisa ser
            confirmada pelo profissional.
          </p>
        </div>
      )}
    </section>
  )
}