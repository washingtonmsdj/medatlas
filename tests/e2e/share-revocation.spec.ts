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

async function expectSelfContainedInvalidLink(page: Page) {
  await expect(
    page.getByRole('heading', { name: 'Este link não está disponível.' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Voltar ao MedAtlas' }),
  ).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: 'Voltar ao profissional' }),
  ).toHaveCount(0)
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
  await expectSelfContainedInvalidLink(page)
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

test('tampered stored share is rejected when patient explanation exceeds the product boundary', async ({
  page,
}) => {
  const shareUrl = await publishReadyReport(page)

  const tampered = await page.evaluate(() => {
    const prefix = 'medatlas:demo:published:'
    const key = Array.from({ length: window.localStorage.length }, (_, index) =>
      window.localStorage.key(index),
    ).find((candidate) => candidate?.startsWith(prefix))

    if (!key) return false

    const raw = window.localStorage.getItem(key)
    if (!raw) return false

    const stored = JSON.parse(raw)
    stored.report.finding.patientExplanation = 'a'.repeat(4001)
    window.localStorage.setItem(key, JSON.stringify(stored))
    return true
  })

  expect(tampered).toBe(true)
  await page.goto(shareUrl)

  await expectSelfContainedInvalidLink(page)
})
