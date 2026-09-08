import { expect, test } from '@playwright/test'

test('team invitations stay unavailable until backend is connected', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Equipe' }).click()

  await expect(page.getByRole('heading', { name: 'Equipe' })).toBeVisible()
  await expect(page.getByText('Adicionar membro')).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Convidar membro' }),
  ).toBeDisabled()
})
