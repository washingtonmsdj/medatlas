import { expect, test } from '@playwright/test'

test('bounds the patient explanation before it mutates the clinical workflow', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Relatórios' }).click()

  const composer = page.locator('.report-composer')
  const editor = composer.getByRole('textbox', {
    name: 'Explicação para o paciente',
  })

  await expect(editor).toBeVisible()
  await expect(editor).toBeEnabled()

  const acceptedText = 'Explicação sintética revisável pelo profissional.'
  await editor.fill(acceptedText)
  await expect(editor).toHaveValue(acceptedText)
  await expect(composer.getByText(/\/ 4\.000 caracteres$/)).toBeVisible()

  await editor.fill('a'.repeat(4001))

  await expect(editor).toHaveValue(acceptedText)
  await expect(composer.getByRole('alert')).toHaveText(
    'A explicação deve ter no máximo 4.000 caracteres.',
  )
})

test('patient preview never presents pending content as clinically reviewed', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Relatórios' }).click()

  const composer = page.locator('.report-composer')
  const editor = composer.getByRole('textbox', {
    name: 'Explicação para o paciente',
  })

  await editor.fill('Texto sintético alterado e ainda não aprovado.')

  await expect(
    composer.getByRole('button', { name: 'Aprovar explicação' }),
  ).toBeEnabled()
  await expect(
    page
      .locator('.workspace-page')
      .getByRole('button', { name: 'Prévia do paciente' }),
  ).toHaveCount(1)

  await composer
    .getByRole('button', { name: 'Prévia do paciente' })
    .click()

  await expect(page.locator('.patient-shell')).toBeVisible()
  await expect(
    page.getByText('REVISÃO PENDENTE', { exact: true }),
  ).toBeVisible()
  await expect(
    page.getByText('Revisão clínica pendente', { exact: true }),
  ).toBeVisible()
  await expect(
    page.getByText('Esta prévia ainda não foi aprovada pelo profissional.'),
  ).toBeVisible()
  await expect(page.getByText(/Revisado por/)).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: 'Imprimir prévia' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Voltar ao profissional' }),
  ).toHaveCount(1)
  await expect(
    page.getByRole('button', { name: 'Voltar para visão profissional' }),
  ).toHaveCount(0)
})
