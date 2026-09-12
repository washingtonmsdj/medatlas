# OCR browser contract

The browser suite treats OCR output and OCR infrastructure differently on purpose.

- OCR text is probabilistic. Real Tesseract output must prove stable semantic recognition of the synthetic source (`SINTETICO` + the `CORAC` root), but the test must not require byte-for-byte transcription of every glyph.
- Runtime integrity is deterministic. Worker, core and Portuguese traineddata must remain local, pinned and lazy.
- OCR asset requests must stay same-origin. Remote Tesseract/CDN requests are forbidden.
- The worker must load directly from the local OCR asset path; `blob:` worker fallback is not an accepted runtime contract.
- OCR success only fills editable report source text. It must not run anatomy analysis, confirm anatomy, review or publish automatically.
- Invalid, oversized or excessive-pixel images fail before the OCR runtime is loaded and must preserve the last valid report text.

This distinction keeps the E2E suite strict about security and clinical state while avoiding a false guarantee that OCR engines reproduce every glyph identically across browser/runtime implementations.
