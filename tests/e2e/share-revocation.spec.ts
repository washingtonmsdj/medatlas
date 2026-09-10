import { expect, test, type Page } from '@playwright/test'

async function openReadyReport(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Relatórios' }).click()
  await expect(
    page.getByRole('heading', { name: 'Adicionar laudo' }),
  ).toBeVisible()
}

async function publishReadyReport(page: Page) {
  await openReadyReport(page)

  const publish = page.getByRole('button', {
    name: 'Compartilhar com paciente',
  })
  await expect(publish).toBeEnabled()
  await publish.click()

  await expect(page.getByText('Link pronto para enviar')).toBeVisible()
  return page.locator('.share-box code').innerText()
}

test('editing a published report revokes the previous patient link before applying the new version', async ({
  page,
}) => {
  const shareUrl = await publishReadyReport(page)
  const explanation = page.getByLabel('Explicação para o paciente')
  const previous = await explanation.inputValue()
  const updated = `${previous} Atualização clínica sintética.`

  await explanation.fill(updated)

  await expect(explanation).toHaveValue(updated)
  await expect(page.getByText('Link pronto para enviar')).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: 'Aprovar explicação' }),
  ).toBeEnabled()

  await page.goto(shareUrl)

  await expect(
    page.getByRole('heading', { name: 'Este link não está disponível.' }),
  ).toBeVisible()
})

test('published report mutation fails closed when persisted share revocation is unavailable', async ({
  page,
}) => {
  const shareUrl = await publishReadyReport(page)
  const explanation = page.getByLabel('Explicação para o paciente')
  const previous = await explanation.inputValue()

  await page.evaluate(() => {
    const originalRemoveItem = Storage.prototype.removeItem

    Storage.prototype.removeItem = function removeItem(key) {
      if (String(key).startsWith('medatlas:demo:published:')) {
        throw new DOMException('blocked', 'SecurityError')
      }

      return originalRemoveItem.call(this, key)
    }
  })

  await explanation.fill(`${previous} Esta alteração deve ser bloqueada.`)

  await expect(page.locator('.publish-error')).toContainText(
    'alteração foi bloqueada',
  )
  await expect(explanation).toHaveValue(previous)
  await expect(page.getByText('Link pronto para enviar')).toBeVisible()

  await page.goto(shareUrl)

  await expect(page.getByText('SEU RELATÓRIO VISUAL')).toBeVisible()
})
