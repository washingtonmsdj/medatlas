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
