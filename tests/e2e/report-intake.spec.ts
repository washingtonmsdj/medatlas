import { expect, test, type Page } from '@playwright/test'

async function openBlankReport(page: Page) {
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

test('enforces the report text byte limit before analysis', async ({ page }) => {
  await openBlankReport(page)

  const editor = page.getByRole('textbox', {
    name: 'Texto do laudo ou relatório',
  })
  const analyze = page.getByRole('button', { name: 'Encontrar anatomia' })

  await editor.fill('Laudo sintético válido.')
  await expect(analyze).toBeEnabled()

  const acceptedText = await editor.inputValue()
  await editor.fill('a'.repeat(64 * 1024 + 1))

  await expect(editor).toHaveValue(acceptedText)
  await expect(page.getByRole('alert')).toHaveText(
    'Texto acima do limite de 64 KB.',
  )
  await expect(analyze).toBeDisabled()

  await editor.fill('Novo laudo sintético válido.')
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(analyze).toBeEnabled()
})

test('describes the formats that the browser MVP actually accepts', async ({
  page,
}) => {
  await openBlankReport(page)

  await expect(
    page.getByText('Cole o texto do exame ou importe um arquivo TXT/MD.'),
  ).toBeVisible()
  await expect(
    page.getByLabel('Importar laudo sintético em TXT ou MD'),
  ).toHaveAttribute('accept', '.txt,.md,text/plain,text/markdown')
  await expect(page.getByText('.txt · .md · até 64 KB')).toBeVisible()
})
