import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import {
  anatomySuggestionSourceToken,
  type AnatomySuggestion,
} from '../clinical/anatomy-suggestions'
import {
  REPORT_EXAMPLES,
  type ReportExample,
} from '../clinical/demo-scenarios'
import type {
  IngestionFailureCode,
  TextDocumentIngestionResult,
} from '../ingestion/contracts'
import {
  ingestLocalReportFile,
  LOCAL_REPORT_FILE_ACCEPT,
} from '../ingestion/local-report-file'
import {
  demoReportFileFormatLabel,
  formatDemoImageDimensionLimit,
  formatDemoImageFileLimit,
  formatDemoImagePixelLimit,
  formatDemoPdfFileLimit,
  formatDemoPdfPageLimit,
  formatDemoPdfOcrPageLimit,
  formatDemoTextLimit,
  isDemoImageFilenameAllowed,
  isDemoPdfFilenameAllowed,
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

type IngestionFailure = Exclude<TextDocumentIngestionResult, { ok: true }>

function ingestionFailureMessage(failure: IngestionFailure) {
  const normalizedName = failure.fileName.toLowerCase()
  const isPdf = normalizedName.endsWith('.pdf')
  const isImage =
    normalizedName.endsWith('.png') ||
    normalizedName.endsWith('.jpg') ||
    normalizedName.endsWith('.jpeg')

  switch (failure.code) {
    case 'unsupported-extension':
      return 'Formato não suportado. Use .txt, .md, .pdf, .png, .jpg ou .jpeg.'
    case 'unsupported-media-type':
      return 'Tipo de arquivo incompatível com a extensão selecionada.'
    case 'too-large':
      if (isPdf) return `PDF acima do limite de ${formatDemoPdfFileLimit()}.`
      if (isImage) return `Imagem acima do limite de ${formatDemoImageFileLimit()}.`
      return `Arquivo acima do limite de ${formatDemoTextLimit()}.`
    case 'too-short':
      return 'O arquivo não contém texto suficiente para análise.'
    case 'invalid-encoding':
      return 'O arquivo precisa estar em UTF-8 válido.'
    case 'invalid-signature':
      return isImage
        ? 'A assinatura da imagem não corresponde ao formato selecionado.'
        : 'O arquivo não possui uma assinatura PDF válida.'
    case 'invalid-dimensions':
      return 'Não foi possível validar as dimensões da imagem.'
    case 'too-many-pixels':
      return isPdf
        ? 'PDF escaneado excede o orçamento total de pixels do OCR local.'
        : `Imagem acima do limite de ${formatDemoImagePixelLimit()} ou ${formatDemoImageDimensionLimit()}.`
    case 'too-many-pages':
      return `PDF acima do limite de ${formatDemoPdfPageLimit()}.`
    case 'too-many-ocr-pages':
      return `PDF escaneado acima do limite de ${formatDemoPdfOcrPageLimit()} para OCR local.`
    case 'too-much-text':
      return `O texto extraído excede o limite de ${formatDemoTextLimit()}.`
    case 'no-extractable-text':
      return isImage
        ? 'O OCR local não encontrou texto suficiente na imagem.'
        : 'O PDF não contém texto extraível e o OCR local não encontrou texto suficiente.'
    case 'encrypted-document':
      return 'PDF protegido por senha não é suportado.'
    case 'malformed-document':
      return 'PDF inválido ou corrompido.'
    case 'render-failed':
      return 'Não foi possível renderizar o PDF escaneado para OCR local.'
    case 'ocr-runtime-unavailable':
      return 'Não foi possível carregar o OCR local.'
    case 'ocr-failed':
      return isPdf
        ? 'Não foi possível extrair texto do PDF escaneado.'
        : 'Não foi possível extrair texto da imagem.'
    case 'cancelled':
      return 'OCR cancelado. O texto anterior foi preservado.'
    case 'parse-failed':
      return 'Não foi possível processar o PDF.'
    case 'read-failed':
      return 'Não foi possível ler o arquivo local.'
  }
}

function formatImportedFileMeta(
  result: Extract<TextDocumentIngestionResult, { ok: true }>['document'],
) {
  if (result.format === 'pdf' && result.pageCount) {
    const ocrSuffix = result.ocrPageCount
      ? ` · OCR local (${result.ocrPageCount} página${result.ocrPageCount === 1 ? '' : 's'})`
      : ''
    return `${result.pageCount} página${result.pageCount === 1 ? '' : 's'} · ${result.extractedTextBytes.toLocaleString('pt-BR')} bytes extraídos${ocrSuffix}`
  }

  if (result.format === 'image' && result.width && result.height) {
    return `${result.width.toLocaleString('pt-BR')}×${result.height.toLocaleString('pt-BR')} px · ${result.extractedTextBytes.toLocaleString('pt-BR')} bytes extraídos · OCR local`
  }

  return `${result.extractedTextBytes.toLocaleString('pt-BR')} bytes`
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
  const [fileMeta, setFileMeta] = useState('')
  const [importingFile, setImportingFile] = useState(false)
  const [ocrProgress, setOcrProgress] = useState<number | null>(null)
  const [ocrStatus, setOcrStatus] = useState('')
  const activeImportController = useRef<AbortController | null>(null)
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
    if (importingFile && ocrProgress !== null) {
      return {
        label: 'Extraindo texto',
        detail: `${ocrStatus || 'OCR local'} · ${Math.round(ocrProgress * 100)}%`,
        tone: 'working',
      }
    }

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
  }, [
    analyzing,
    currentSuggestions.length,
    importingFile,
    ocrProgress,
    ocrStatus,
    sourceTextError,
    sourceValidation.ok,
  ])

  const importLocalFile = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''

    if (!file) return

    const isImage = isDemoImageFilenameAllowed(file.name)
    const isPdf = isDemoPdfFilenameAllowed(file.name)
    const controller = isImage || isPdf ? new AbortController() : null
    activeImportController.current = controller

    setFileError('')
    setSourceTextError('')
    setFileName('')
    setFileMeta('')
    setImportingFile(true)
    setOcrProgress(isImage ? 0 : null)
    setOcrStatus(isImage ? 'Preparando OCR local' : '')

    try {
      const result = await ingestLocalReportFile(file, {
        signal: controller?.signal,
        onOcrProgress: ({ status, progress }) => {
          setOcrStatus(status)
          setOcrProgress(progress)
        },
      })

      if (!result.ok) {
        setFileError(ingestionFailureMessage(result))
        return
      }

      onSourceTextChange(result.document.text)
      setFileName(result.document.fileName)
      setFileMeta(formatImportedFileMeta(result.document))
    } finally {
      if (activeImportController.current === controller) {
        activeImportController.current = null
      }
      setImportingFile(false)
      setOcrProgress(null)
      setOcrStatus('')
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
          <p>Cole o texto ou importe TXT, MD, PDF, PNG ou JPG.</p>
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
              disabled={importingFile}
              onClick={() => {
                setFileError('')
                setSourceTextError('')
                setFileName('')
                setFileMeta('')
                onLoadExample(example)
              }}
            >
              {example.label}
            </button>
          ))}
        </div>

        <label className={`file-import-button${importingFile ? ' disabled' : ''}`}>
          <input
            aria-label="Importar laudo sintético em TXT, MD, PDF, PNG ou JPG"
            type="file"
            accept={LOCAL_REPORT_FILE_ACCEPT}
            disabled={importingFile}
            onChange={(event) => void importLocalFile(event)}
          />
          <span aria-hidden="true">↑</span>
          Importar arquivo
        </label>
      </div>

      {importingFile && ocrProgress !== null && (
        <div className="ocr-progress-panel" role="status" aria-live="polite">
          <div className="ocr-progress-heading">
            <div>
              <strong>OCR local</strong>
              <small>{ocrStatus || 'Extraindo texto da imagem'}</small>
            </div>
            <span>{Math.round(ocrProgress * 100)}%</span>
          </div>
          <progress
            aria-label="Progresso do OCR local"
            max={100}
            value={Math.round(ocrProgress * 100)}
          />
          <button
            type="button"
            className="ocr-cancel-button"
            onClick={() => activeImportController.current?.abort()}
          >
            Cancelar OCR
          </button>
        </div>
      )}

      <div className="intake-editor-shell">
        <div className="intake-editor-toolbar">
          <span>Texto do laudo</span>
          <div>
            {fileName && <strong>{fileName}</strong>}
            <small>
              {fileMeta || `${sourceValidation.bytes.toLocaleString('pt-BR')} bytes`} · limite{' '}
              {formatDemoTextLimit()}
            </small>
          </div>
        </div>

        <textarea
          className="intake-editor"
          aria-label="Texto do laudo ou relatório"
          value={sourceText}
          disabled={importingFile}
          onChange={(event) => {
            const nextValue = event.target.value
            const validation = validateDemoReportSource(nextValue)

            setFileName('')
            setFileMeta('')
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
            {demoReportFileFormatLabel()} · texto até {formatDemoTextLimit()}
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
          disabled={
            analyzing ||
            importingFile ||
            !sourceValidation.ok ||
            Boolean(sourceTextError)
          }
        >
          {analyzing ? 'Analisando…' : analyzeLabel}
        </button>
        <span>
          {importingFile
            ? 'Conclua ou cancele a extração antes de localizar a anatomia.'
            : anatomyReviewRequired
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
