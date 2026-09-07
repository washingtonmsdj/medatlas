import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

async function expectNoBlockingViolations(
  page: Page,
  surface: string,
) {
  const result = await new AxeBuilder({ page })
    .withTags([
      'wcag2a',
      'wcag2aa',
      'wcag21a',
      'wcag21aa',
      'wcag22aa',
    ])
    .analyze()

  const blocking = result.violations
    .filter(
      (violation) =>
        violation.impact === 'critical' ||
        violation.impact === 'serious',
    )
    .map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      targets: violation.nodes.flatMap((node) => node.target),
    }))

  expect(
    blocking,
    `${surface} has blocking axe violations:\n${JSON.stringify(
      blocking,
      null,
      2,
    )}`,
  ).toEqual([])
}

async function openReports(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Relatórios' }).click()
  await expect(
    page.getByRole('heading', {
      name: 'Localizar anatomia mencionada',
    }),
  ).toBeVisible()
}

test('overview and clinical report workspace have no serious axe violations', async ({
  page,
}) => {
  await page.goto('/')

  await expectNoBlockingViolations(page, 'Overview')

  const skipLink = page.getByRole('link', {
    name: 'Ir para o conteúdo principal',
  })
  await page.keyboard.press('Tab')
  await expect(skipLink).toBeFocused()

  await openReports(page)
  await expectNoBlockingViolations(page, 'Clinical report workspace')
})

test('patient handoff has no serious axe violations', async ({ page }) => {
  await openReports(page)

  await page.getByRole('button', { name: 'Coração', exact: true }).click()
  await page.getByRole('button', { name: 'Sugerir estruturas' }).click()

  const heartSuggestion = page
    .locator('.suggestion-item')
    .filter({ hasText: 'FMA7088' })

  await heartSuggestion
    .getByRole('button', { name: 'Confirmar estrutura' })
    .click()

  await page
    .getByRole('button', { name: 'Gerar rascunho educacional' })
    .click()

  await page
    .getByRole('button', { name: 'Confirmar explicação revisada' })
    .click()

  await page
    .getByRole('button', { name: 'Aprovar e gerar link do paciente' })
    .click()

  const [patientPage] = await Promise.all([
    page.waitForEvent('popup'),
    page
      .getByRole('button', { name: 'Abrir visão do paciente' })
      .click(),
  ])

  await patientPage.waitForLoadState('domcontentloaded')
  await expect(
    patientPage.getByText('SEU EXAME, EXPLICADO VISUALMENTE'),
  ).toBeVisible()

  await expectNoBlockingViolations(patientPage, 'Patient report')
})
