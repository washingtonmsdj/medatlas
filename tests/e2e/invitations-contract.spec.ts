import { expect, test } from '@playwright/test'

test('team MVP does not expose unavailable invitation actions', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Equipe' }).click()

  await expect(page.getByRole('heading', { name: 'Equipe' })).toBeVisible()
  await expect(page.getByText('Permissões por papel', { exact: true })).toBeVisible()
  await expect(page.getByText('Adicionar membro', { exact: true })).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: /convid|convite/i }),
  ).toHaveCount(0)
})
