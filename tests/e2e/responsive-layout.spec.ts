import { expect, test, type Page } from '@playwright/test'

const MODULES = [
  {
    button: 'Visão geral',
    heading: 'Visão geral do fluxo clínico visual.',
  },
  {
    button: 'Relatórios',
    heading: 'Localizar anatomia mencionada',
  },
  {
    button: 'Pacientes',
    heading: 'Contexto sintético do relatório atual',
  },
  {
    button: 'Consultas',
    heading: 'Sessão clínica visual em andamento',
  },
  {
    button: 'Exames',
    heading: 'Entrada local de laudos sintéticos',
  },
  {
    button: 'Configurações',
    heading: 'Ambiente sintético e controles locais',
  },
] as const

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))

  expect(
    dimensions.scrollWidth,
    `horizontal overflow: ${dimensions.scrollWidth}px > ${dimensions.clientWidth}px`,
  ).toBeLessThanOrEqual(dimensions.clientWidth + 1)
}

async function openModule(
  page: Page,
  module: (typeof MODULES)[number],
) {
  await page
    .getByRole('button', { name: module.button })
    .first()
    .click()

  await expect(
    page.getByRole('heading', { name: module.heading }),
  ).toBeVisible()
}

test('desktop SaaS surfaces stay inside 1600px and 1440px viewports', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 1000 })
  await page.goto('/')

  for (const module of MODULES) {
    await openModule(page, module)
    await expectNoHorizontalOverflow(page)
  }

  await page.setViewportSize({ width: 1440, height: 960 })

  for (const module of MODULES) {
    await openModule(page, module)
    await expectNoHorizontalOverflow(page)
  }
})

test('mobile SaaS surfaces stay inside a 390px viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  for (const module of MODULES) {
    await openModule(page, module)
    await expectNoHorizontalOverflow(page)
  }
})
