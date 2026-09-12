import { mkdir } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'

const MODULES = [
  {
    button: 'Visão geral',
    heading: 'Atendimento em andamento',
  },
  {
    button: 'Relatórios',
    heading: 'Adicionar laudo',
  },
  {
    button: 'Pacientes',
    heading: 'Paciente demonstração',
  },
  {
    button: 'Equipe',
    heading: 'Equipe',
  },
  {
    button: 'Analytics',
    heading: 'Desempenho dos relatórios',
  },
  {
    button: 'Configurações',
    heading: 'Configurações do workspace',
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

async function capture(page: Page, name: string) {
  await mkdir('test-results/visual-qa', { recursive: true })
  await page.screenshot({
    path: `test-results/visual-qa/${name}.png`,
    fullPage: true,
  })
}

const MOBILE_PRIMARY_MODULES = new Set(['Visão geral', 'Pacientes'])

function mobileModuleLabel(button: (typeof MODULES)[number]['button']) {
  return button === 'Relatórios' ? 'Laudos' : button
}

async function openModule(
  page: Page,
  module: (typeof MODULES)[number],
) {
  const mobile = (page.viewportSize()?.width ?? Number.POSITIVE_INFINITY) <= 860

  if (mobile && !MOBILE_PRIMARY_MODULES.has(module.button)) {
    const more = page.getByRole('button', { name: 'Mais módulos' })
    await more.click()

    const overflow = page.locator('#clinical-sidebar-more-menu')
    await expect(overflow).toBeVisible()
    await overflow
      .getByRole('button', { name: mobileModuleLabel(module.button), exact: true })
      .click()
  } else {
    await page
      .getByRole('button', { name: module.button })
      .first()
      .click()
  }

  await expect(
    page.getByRole('heading', { name: module.heading }),
  ).toBeVisible()
}

test('desktop SaaS surfaces stay inside 1600px and 1440px viewports', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 1000 })
  await page.goto('/')
  await expect(
    page.getByRole('heading', {
      name: 'Atendimento em andamento',
    }),
  ).toBeVisible()
  await expect(
    page
      .locator('.overview-atlas-panel')
      .getByText('3D carregado', { exact: true }),
  ).toBeVisible({ timeout: 60_000 })
  await capture(page, 'dashboard-1600')

  for (const module of MODULES) {
    await openModule(page, module)
    await expectNoHorizontalOverflow(page)

    const captureNames: Partial<Record<(typeof MODULES)[number]['button'], string>> = {
      Relatórios: 'clinical-studio-1600',
      Pacientes: 'patients-3d-1600',
      Analytics: 'analytics-1600',
      Equipe: 'team-1600',
      Configurações: 'settings-1600',
    }

    const captureName = captureNames[module.button]
    if (captureName) {
      await capture(page, captureName)
    }
  }

  await page.setViewportSize({ width: 1440, height: 960 })

  for (const module of MODULES) {
    await openModule(page, module)
    await expectNoHorizontalOverflow(page)

    const captureNames: Partial<Record<(typeof MODULES)[number]['button'], string>> = {
      Relatórios: 'clinical-studio-1440',
      Pacientes: 'patients-3d-1440',
      Analytics: 'analytics-1440',
      Equipe: 'team-1440',
      Configurações: 'settings-1440',
    }

    const captureName = captureNames[module.button]
    if (captureName) {
      await capture(page, captureName)
    }
  }
})

test('clinical Studio keeps a desktop-first three-column productivity layout', async ({
  page,
}) => {
  for (const viewport of [
    { width: 1600, height: 1000 },
    { width: 1440, height: 960 },
  ]) {
    await page.setViewportSize(viewport)
    await page.goto('/')
    await page.getByRole('button', { name: 'Relatórios' }).click()

    const studio = page.locator('.clinical-report-studio')
    await expect(studio).toHaveAttribute(
      'data-surface-priority',
      'desktop-first',
    )

    const source = page.locator('.report-source-column')
    const atlas = page.locator('.report-atlas-column')
    const explanation = page.locator('.report-explanation-column')
    const stage = page.locator('.clinical-atlas-stage')

    const [sourceBox, atlasBox, explanationBox, stageBox] =
      await Promise.all([
        source.boundingBox(),
        atlas.boundingBox(),
        explanation.boundingBox(),
        stage.boundingBox(),
      ])

    expect(sourceBox).not.toBeNull()
    expect(atlasBox).not.toBeNull()
    expect(explanationBox).not.toBeNull()
    expect(stageBox).not.toBeNull()

    expect(Math.abs(sourceBox!.y - atlasBox!.y)).toBeLessThan(2)
    expect(Math.abs(atlasBox!.y - explanationBox!.y)).toBeLessThan(2)
    expect(atlasBox!.width).toBeGreaterThan(sourceBox!.width)
    expect(atlasBox!.width).toBeGreaterThan(430)
    expect(explanationBox!.width).toBeGreaterThan(300)
    expect(stageBox!.height).toBeGreaterThanOrEqual(560)

    await expectNoHorizontalOverflow(page)
  }
})

test('mobile SaaS surfaces stay inside a 390px viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(
    page.getByRole('heading', {
      name: 'Atendimento em andamento',
    }),
  ).toBeVisible()

  const skipLink = page.getByRole('link', {
    name: 'Ir para o conteúdo principal',
  })
  await expect(skipLink).toHaveCSS('opacity', '0')

  const dashboardMobile3dStage = page.locator(
    '.overview-atlas-panel .anatomy-focus-preview-stage',
  )
  await expect(dashboardMobile3dStage).toBeVisible()

  const dashboardMobile3dHost = page.locator(
    '.overview-atlas-panel .human-atlas-scene .reference-atlas-scene',
  )
  const dashboardMobile3dCanvas = dashboardMobile3dHost.locator('canvas')
  await expect(dashboardMobile3dCanvas).toBeVisible({ timeout: 60_000 })

  const [dashboardMobile3dStageBox, dashboardMobile3dHostBox, dashboardMobile3dCanvasBox] =
    await Promise.all([
      dashboardMobile3dStage.boundingBox(),
      dashboardMobile3dHost.boundingBox(),
      dashboardMobile3dCanvas.boundingBox(),
    ])
  expect(dashboardMobile3dStageBox).not.toBeNull()
  expect(dashboardMobile3dHostBox).not.toBeNull()
  expect(dashboardMobile3dCanvasBox).not.toBeNull()
  expect(dashboardMobile3dStageBox!.height).toBeGreaterThanOrEqual(400)
  expect(dashboardMobile3dHostBox!.height).toBeGreaterThanOrEqual(400)
  expect(dashboardMobile3dCanvasBox!.height).toBeGreaterThanOrEqual(400)
  expect(
    Math.abs(dashboardMobile3dCanvasBox!.height - dashboardMobile3dStageBox!.height),
  ).toBeLessThanOrEqual(1)

  await expect(
    page
      .locator('.overview-atlas-panel')
      .getByText('3D carregado', { exact: true }),
  ).toBeVisible({ timeout: 60_000 })

  await capture(page, 'dashboard-mobile-390')

  for (const module of MODULES) {
    await openModule(page, module)
    await expectNoHorizontalOverflow(page)

    const captureNames: Partial<Record<(typeof MODULES)[number]['button'], string>> = {
      Relatórios: 'clinical-studio-mobile-390',
      Pacientes: 'patients-3d-mobile-390',
      Analytics: 'analytics-mobile-390',
      Equipe: 'team-mobile-390',
      Configurações: 'settings-mobile-390',
    }

    const captureName = captureNames[module.button]
    if (captureName) {
      await capture(page, captureName)
    }
  }
})

test('mobile concept shell stays compact without legacy switchers', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  const search = page.getByRole('combobox', {
    name: 'Buscar paciente, relatório, anatomia ou módulo',
  })
  const profile = page.getByRole('button', {
    name: 'Abrir menu do profissional',
  })

  await expect(search).toBeVisible()
  await expect(profile).toBeVisible()
  await expect(page.locator('.organization-switcher-shell')).toHaveCount(0)
  await expect(
    page.getByRole('group', { name: 'Alternar visão do MedAtlas' }),
  ).toHaveCount(0)

  const heights = await page.evaluate(() => {
    const sidebar = document.querySelector<HTMLElement>('.clinical-sidebar')
    const topbar = document.querySelector<HTMLElement>('.clinical-topbar')

    return {
      sideba