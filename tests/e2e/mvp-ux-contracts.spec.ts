import { expect, test, type Page } from '@playwright/test'

async function openReports(page: Page) {
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: 'Atendimento em andamento' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Relatórios' }).click()
  await expect(
    page.getByRole('heading', { name: 'Adicionar laudo' }),
  ).toBeVisible()
}

test('overview presents task KPIs as counts instead of version-shaped metrics', async ({
  page,
}) => {
  await page.goto('/')

  const summary = page.getByRole('region', {
    name: 'Resumo do atendimento demonstrativo',
  })

  const currentReport = summary
    .locator('.overview-kpi-card')
    .filter({ hasText: 'Relatório atual' })
  await expect(currentReport.locator('strong')).toHaveText('1')
  await expect(currentReport).toContainText('Versão v1')

  const pending = summary
    .locator('.overview-kpi-card')
    .filter({ hasText: 'Aguardando ação' })
  await expect(pending.locator('strong')).toHaveText('1')
  await expect(pending.locator('strong')).not.toHaveText(/^0\d/)
})

test('published patient portal stays self-contained', async ({ page }) => {
  await openReports(page)

  const publish = page.getByRole('button', {
    name: 'Compartilhar com paciente',
  })
  await expect(publish).toBeEnabled()
  await publish.click()

  await expect(page.getByText('Link pronto')).toBeVisible()

  const [patientPage] = await Promise.all([
    page.waitForEvent('popup'),
    page.getByRole('button', { name: 'Abrir link' }).click(),
  ])

  await patientPage.waitForLoadState('domcontentloaded')
  await expect(patientPage.getByText('SEU RELATÓRIO VISUAL')).toBeVisible()
  await expect(
    patientPage.getByRole('button', { name: 'Imprimir / salvar PDF' }),
  ).toBeVisible()
  await expect(
    patientPage.getByRole('button', { name: 'Voltar ao profissional' }),
  ).toHaveCount(0)
  await expect(
    patientPage.getByRole('button', { name: 'Voltar ao MedAtlas' }),
  ).toHaveCount(0)

  await patientPage.close()
})

test('demo settings expose read-only branding without duplicating the new report launcher', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Configurações' }).click()

  await expect(
    page.getByRole('heading', { name: 'Configurações do workspace' }),
  ).toBeVisible()
  await expect(page.getByText('Somente leitura no demo')).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Editar identidade' }),
  ).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: 'Criar relatório' }),
  ).toHaveCount(0)
  await expect(page.locator('.settings-actions')).toHaveCount(0)

  await page.getByRole('button', { name: 'Visão geral' }).click()
  await expect(
    page.getByRole('button', { name: 'Novo relatório', exact: true }),
  ).toBeVisible()
})
