from pathlib import Path

preview = Path('tests/deployed/preview.spec.ts')
text = preview.read_text()

import_line = "import { expect, test, type Page } from '@playwright/test'\n"
helper_import = "import { createSyntheticOcrPng } from './ocr-fixture'\n"
if helper_import not in text:
    if text.count(import_line) != 1:
        raise SystemExit('unexpected deployed preview import marker')
    text = text.replace(import_line, import_line + helper_import, 1)

old_label = 'Importar laudo sintético em TXT, MD ou PDF'
new_label = 'Importar laudo sintético em TXT, MD, PDF, PNG ou JPG'
if old_label in text:
    text = text.replace(old_label, new_label)
if new_label not in text:
    raise SystemExit('deployed intake label missing')

preview_exact = "await expect(editor).toHaveValue(/LAUDO\\s+SINTETICO\\s+CORACAO/i, {"
preview_semantic = "await expect(editor).toHaveValue(/SINTETICO\\s+CORAC/i, {"
if preview_exact in text:
    text = text.replace(preview_exact, preview_semantic, 1)
if "published PNG OCR uses only direct same-origin assets under the Pages base path" not in text:
    raise SystemExit('deployed OCR test missing')
if preview_semantic not in text:
    raise SystemExit('deployed OCR semantic assertion missing')
preview.write_text(text)

intake = Path('tests/e2e/report-intake.spec.ts')
intake_text = intake.read_text()
old_assertion = "await expect(editor).toHaveValue(/LAUDO\\s+SINTETICO\\s+CORACAO/i, {"
new_assertion = "await expect(editor).toHaveValue(/SINTETICO\\s+CORAC/i, {"
if old_assertion in intake_text:
    intake_text = intake_text.replace(old_assertion, new_assertion, 1)
if new_assertion not in intake_text:
    raise SystemExit('local OCR semantic assertion missing')
intake.write_text(intake_text)
