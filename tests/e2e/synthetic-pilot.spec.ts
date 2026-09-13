import { expect, test, type Page } from '@playwright/test'

async function startBlankReport(page: Page) {
  await page.goto('/')

  const search = page.getByRole('combobox', {
    name: 'Buscar paciente, relatório, anatomia ou módulo',
  })
  await search.fill('Novo relatório')
  await page
    .getByRole('listbox', { name: 'Resultados da busca global' })
    .getByRole('option', { name: /Novo relatório/ })
    .click()

  await expect(
    page.getByRole('heading', { name: 'Adicionar laudo' }),
  ).toBeVisible()
}

test('synthetic pilot connects local intake to reviewed patient publication and revokes stale share', async ({
  page,
}) => {
  test.setTimeout(120_000)
  await startBlankReport(page)

  const importInput = page.getByLabel(
    'Importar laudo sintético em TXT, MD, PDF, PNG ou JPG',
  )
  await importInput.setInputFiles({
    name: 'piloto-coracao.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from(
      'Relatório cardiológico sintético: avaliação do coração e do tórax em anatomia humana de referência.',
      'utf8',
    ),
  })

  const editor = page.getByRole('textbox', {
    name: 'Texto do laudo ou relatório',
  })
  await expect(editor).toHaveValue(/coração/i)
  await expect(page.getByText('piloto-coracao.txt', { exact: true })).toBeVisible()
  await expect(page.getByText('ESTRUTURAS ENCONTRADAS')).toHaveCount(0)

  await page.getByRole('button', { name: 'Encontrar anatomia' }).click()

  const heartSuggestion = page
    .locator('.suggestion-item')
    .filter({ hasText: 'Coração' })
  await expect(heartSuggestion).toBeVisible()
  await heartSuggestion
    .getByRole('button', { name: 'Usar estrutura' })
    .click()

  await expect(page.getByText('ANATOMIA CONFIRMADA')).toBeVisible()
  await expect(
    page.locator('.report-atlas-column .human-atlas-scene canvas'),
  ).toBeVisible({ timeout: 45_000 })

  const draft = page.getByRole('button', { name: 'Gerar rascunho' })
  await expect(draft).toBeEnabled()
  await draft.click()

  const explanation = page.getByLabel('Explicação para o paciente')
  await expect(explanation).toContainText('tórax')

  const preview = page
    .locator('.patient-preview-control')
    .getByRole('button', { name: 'Prévia do paciente' })
  await preview.click()
  await expect(page.getByText('VISÃO DO PACIENTE · PRÉVIA')).toBeVisible()
  await expect(
    page.locator('#patient-anatomy .human-atlas-scene canvas'),
  ).toBeVisible({ timeout: 45_000 })
  await page.getByRole('button', { name: 'Voltar ao profissional' }).click()

  await page.getByRole('button', { name: 'Aprovar explicação' }).click()

  const publish = page.getByRole('button', {
    name: 'Compartilhar com paciente',
  })
  await expect(publish).toBeEnabled()
  await publish.click()
  await expect(page.getByText('Link pronto')).toBeVisible()

  const shareUrl = await page.locator('.share-box code').innerText()

  const [patientPage] = await Promise.all([
    page.waitForEvent('popup'),
    page.getByRole('button', { name: 'Abrir link' }).click(),
  ])
  await patientPage.waitForLoadState('domcontentloaded')
  await expect(patientPage.getByText('SEU RELATÓRIO VISUAL')).toBeVisible()
  await expect(patientPage.getByText('REVISADO', { exact: true })).toBeVisible()
  await expect(
    patientPage
      .locator('#patient-anatomy')
      .getByRole('heading', { name: 'Coração', exact: true }),
  ).toBeVisible()
  await expect(
    patientPage.locator('#patient-anatomy .human-atlas-scene canvas'),
  ).toBeVisible({ timeout: 45_000 })
  await expect(patientPage.locator('#patient-anatomy')).not.toContainText(
    'FMA7088',
  )
  await patientPage.close()

  await editor.fill(
    'Relatório sintético atualizado: avaliação do rim direito em anatomia humana de referência.',
  )

  await expect(
    page.getByText('RECONFIRMAÇÃO NECESSÁRIA').first(),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Encontrar anatomia' }),
  ).toBeEnabled()
  await expect(
    page.getByRole('button', { name: 'Gerar rascunho' }),
  ).toBeDisabled()

  await page.goto(shareUrl)
  await expect(
    page.getByRole('heading', { name: 'Este link não está disponível.' }),
  ).toBeVisible()
})
