from pathlib import Path

path = Path('src/components/ReportIntake.tsx')
text = path.read_text()

replacements = [
    (
        '  formatDemoPdfPageLimit,\n  formatDemoTextLimit,\n  isDemoImageFilenameAllowed,',
        '  formatDemoPdfPageLimit,\n  formatDemoPdfOcrPageLimit,\n  formatDemoTextLimit,\n  isDemoImageFilenameAllowed,\n  isDemoPdfFilenameAllowed,',
    ),
    (
        "    case 'too-many-pixels':\n      return `Imagem acima do limite de ${formatDemoImagePixelLimit()} ou ${formatDemoImageDimensionLimit()}.`\n    case 'too-many-pages':\n      return `PDF acima do limite de ${formatDemoPdfPageLimit()}.`",
        "    case 'too-many-pixels':\n      return isPdf\n        ? 'PDF escaneado excede o orçamento total de pixels do OCR local.'\n        : `Imagem acima do limite de ${formatDemoImagePixelLimit()} ou ${formatDemoImageDimensionLimit()}.`\n    case 'too-many-pages':\n      return `PDF acima do limite de ${formatDemoPdfPageLimit()}.`\n    case 'too-many-ocr-pages':\n      return `PDF escaneado acima do limite de ${formatDemoPdfOcrPageLimit()} para OCR local.`",
    ),
    (
        "    case 'no-extractable-text':\n      return isImage\n        ? 'O OCR local não encontrou texto suficiente na imagem.'\n        : 'Este PDF não contém texto extraível. Imagem/OCR do PDF ainda não é suportado.'",
        "    case 'no-extractable-text':\n      return isImage\n        ? 'O OCR local não encontrou texto suficiente na imagem.'\n        : 'O PDF não contém texto extraível e o OCR local não encontrou texto suficiente.'",
    ),
    (
        "    case 'malformed-document':\n      return 'PDF inválido ou corrompido.'\n    case 'ocr-runtime-unavailable':",
        "    case 'malformed-document':\n      return 'PDF inválido ou corrompido.'\n    case 'render-failed':\n      return 'Não foi possível renderizar o PDF escaneado para OCR local.'\n    case 'ocr-runtime-unavailable':",
    ),
    (
        "    case 'ocr-failed':\n      return 'Não foi possível extrair texto da imagem.'",
        "    case 'ocr-failed':\n      return isPdf\n        ? 'Não foi possível extrair texto do PDF escaneado.'\n        : 'Não foi possível extrair texto da imagem.'",
    ),
    (
        "  if (result.format === 'pdf' && result.pageCount) {\n    return `${result.pageCount} página${result.pageCount === 1 ? '' : 's'} · ${result.extractedTextBytes.toLocaleString('pt-BR')} bytes extraídos`\n  }",
        "  if (result.format === 'pdf' && result.pageCount) {\n    const ocrSuffix = result.ocrPageCount\n      ? ` · OCR local (${result.ocrPageCount} página${result.ocrPageCount === 1 ? '' : 's'})`\n      : ''\n    return `${result.pageCount} página${result.pageCount === 1 ? '' : 's'} · ${result.extractedTextBytes.toLocaleString('pt-BR')} bytes extraídos${ocrSuffix}`\n  }",
    ),
    (
        "    const isImage = isDemoImageFilenameAllowed(file.name)\n    const controller = isImage ? new AbortController() : null",
        "    const isImage = isDemoImageFilenameAllowed(file.name)\n    const isPdf = isDemoPdfFilenameAllowed(file.name)\n    const controller = isImage || isPdf ? new AbortController() : null",
    ),
]

for old, new in replacements:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'expected one ReportIntake marker, found {count}: {old[:80]}')
    text = text.replace(old, new, 1)

path.write_text(text)
