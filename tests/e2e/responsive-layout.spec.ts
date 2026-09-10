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

  const dashboardMobile3dStageBox =
    await dashboardMobile3dStage.boundingBox()
  expect(dashboardMobile3dStageBox).not.toBeNull()
  expect(dashboardMobile3dStageBox!.height).toBeGreaterThanOrEqual(400)

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
      sidebar: sidebar?.getBoundingClientRect().height ?? Number.POSITIVE_INFINITY,
      topbar: topbar?.getBoundingClientRect().height ?? Number.POSITIVE_INFINITY,
    }
  })

  expect(heights.sidebar).toBeLessThanOrEqual(145)
  expect(heights.topbar).toBeLessThanOrEqual(80)
  await expectNoHorizontalOverflow(page)
})

test('management modules stay readable without internal horizontal scroll on mobile', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  await openModule(page, { button: 'Equipe', heading: 'Equipe' })

  const matrix = page.locator('.permission-matrix')
  await expect(matrix).toBeVisible()
  const matrixSize = await matrix.evaluate((element) => ({
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
  }))
  expect(matrixSize.scrollWidth).toBeLessThanOrEqual(matrixSize.clientWidth + 1)
  await openModule(page, { button: 'Analytics', heading: 'Desempenho dos relatórios' })
  await expect(page.getByText('COM VISUALIZAÇÃO', { exact: true })).toBeVisible()
  await expect(page.getByText(/Última abertura:/)).toBeVisible()

  const metricCards = page.locator('.analytics-metrics > article')
  await expect(metricCards).toHaveCount(4)
  const metricBoxes = await Promise.all(
    [0, 1, 2, 3].map((index) => metricCards.nth(index).boundingBox()),
  )
  for (const box of metricBoxes) {
    expect(box).not.toBeNull()
  }
  expect(Math.abs(metricBoxes[0]!.y - metricBoxes[1]!.y)).toBeLessThan(2)
  expect(Math.abs(metricBoxes[2]!.y - metricBoxes[3]!.y)).toBeLessThan(2)
  expect(metricBoxes[2]!.y).toBeGreaterThan(metricBoxes[0]!.y + 20)

  const analyticsCard = page.locator('.analytics-report-card')
  const analyticsCardSize = await analyticsCard.evaluate((element) => ({
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
  }))
  expect(analyticsCardSize.scrollWidth).toBeLessThanOrEqual(
    analyticsCardSize.clientWidth + 1,
  )

  await openModule(page, { button: 'Configurações', heading: 'Configurações do workspace' })
  await expect(
    page.locator('.settings-card-heading').getByText('Clínica Horizonte', {
      exact: true,
    }),
  ).toBeVisible()
  await expectNoHorizontalOverflow(page)
})

test('full Atlas concept stays usable from desktop to mobile', async ({
  page,
}) => {
  test.setTimeout(120_000)
  await page.setViewportSize({ width: 1600, height: 1000 })
  await page.goto('/')

  await page
    .locator('.clinical-sidebar nav')
    .getByRole('button', { name: 'Atlas 3D' })
    .click()

  const workspace = page.locator('.reference-atlas-workspace')
  const stage = page.locator('.reference-atlas-body-stage')
  const canvas = stage.locator('.reference-atlas-scene canvas')
  const detail = page.locator('.reference-atlas-detail-panel')

  await expect(workspace).toBeVisible()
  await expect(canvas).toBeVisible({ timeout: 100_000 })
  await expect(canvas).toHaveAttribute('tabindex', '0')
  await expect(canvas).toHaveAttribute(
    'aria-keyshortcuts',
    /ArrowLeft.*ArrowRight.*ArrowUp.*ArrowDown.*\+.*-.*Home/,
  )

  await canvas.focus()
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('+')
  await page.keyboard.press('Home')
  await expect(canvas).toBeFocused()

  await expect(
    page.getByRole('complementary', { name: 'Sistemas anatômicos' }),
  ).toBeVisible()
  await expect(detail).toBeVisible()
  await expect(
    page.getByRole('navigation', { name: 'Atalhos do Atlas 3D' }),
  ).toBeVisible()

  await expectNoHorizontalOverflow(page)
  await capture(page, 'atlas-explorer-1600')

  await page.setViewportSize({ width: 1440, height: 960 })
  await page.waitForTimeout(250)
  await expectNoHorizontalOverflow(page)
  await expect(canvas).toBeVisible()
  await capture(page, 'atlas-explorer-1440')

  await page.setViewportSize({ width: 1080, height: 900 })
  await page.waitForTimeout(250)
  await expectNoHorizontalOverflow(page)
  await expect(canvas).toBeVisible()

  const compactCase = await page.locator('.reference-atlas-case-panel').boundingBox()
  const compactBody = await page.locator('.reference-atlas-body-panel').boundingBox()
  const compactDetail = await page.locator('.reference-atlas-detail-panel').boundingBox()
  expect(compactCase).not.toBeNull()
  expect(compactBody).not.toBeNull()
  expect(compactDetail).not.toBeNull()
  expect(compactBody!.x).toBeGreaterThan(compactCase!.x)
  expect(compactDetail!.x).toBeGreaterThan(compactBody!.x)
  expect(compactDetail!.y).toBeLessThan(compactBody!.y + 8)
  await capture(page, 'atlas-explorer-1080')

  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(300)

  await expectNoHorizontalOverflow(page)
  await expect(canvas).toBeVisible()

  const mobileStageBox = await stage.boundingBox()
  expect(mobileStageBox).not.toBeNull()
  expect(mobileStageBox!.height).toBeGreaterThanOrEqual(600)

  const mobilePresets = page.getByRole('navigation', {
    name: 'Atalhos do Atlas 3D',
  })
  await expect(mobilePresets).toBeVisible()
  const presetButtons = mobilePresets.getByRole('button')
  await expect(presetButtons).toHaveCount(6)

  const depthButtons = page.locator('.reference-atlas-depth-switch').getByRole('button')
  await expect(depthButtons).toHaveCount(2)
  for (let index = 0; index < 2; index += 1) {
    const box = await depthButtons.nth(index).boundingBox()
    expect(box).not.toBeNull()
    expect(box!.height).toBeGreaterThanOrEqual(40)
  }

  const bodyToolButtons = page
    .getByRole('navigation', { name: 'Ferramentas do corpo 3D' })
    .getByRole('button')
  for (let index = 0; index < await bodyToolButtons.count(); index += 1) {
    const box = await bodyToolButtons.nth(index).boundingBox()
    expect(box).not.toBeNull()
    expect(box!.width).toBeGreaterThanOrEqual(44)
    expect(box!.height).toBeGreaterThanOrEqual(44)
  }

  await expect(detail).toBeVisible()
  await capture(page, 'atlas-explorer-mobile-390')
})

test('frontend refinement keeps hierarchy explicit on desktop and mobile', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 1000 })
  await page.goto('/')

  await expect(page.locator('.premium-metrics')).toHaveCount(0)
  await expect(page.locator('.mvp-next-step-card')).toHaveCount(0)

  const dashboardFlowMetric = page
  .locator('.overview-kpi-card')
  .filter({ hasText: 'Fluxo concluído' })
await expect(dashboardFlowMetric.locator('strong')).toHaveText('75%')

const currentOverviewStep = page
  .locator('.overview-flow-list > button')
  .filter({ has: page.locator('.overview-status-pill.current') })
await expect(currentOverviewStep).toContainText('Publicar ao paciente')
await expect(currentOverviewStep).toContainText('Em revisão')

  const dashboardStage = page.locator(
    '.overview-atlas-panel .anatomy-focus-preview-stage',
  )
  await expect(dashboardStage).toBeVisible()
  const dashboardStageBox = await dashboardStage.boundingBox()
  expect(dashboardStageBox).not.toBeNull()
  expect(dashboardStageBox!.height).toBeGreaterThanOrEqual(300)

  await page.getByRole('button', { name: 'Relatórios' }).click()

  const currentStep = page.locator(
    '.report-workflow-strip [data-step-state="current"]',
  )
  await expect(currentStep).toHaveCount(1)
  await expect(currentStep).toContainText('Publicar ao paciente')
  await expect(currentStep).toContainText('Em andamento')

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  const mobileBrand = page.locator('.clinical-sidebar-brand')
  const mobileNav = page.locator('.clinical-sidebar nav')

  await expect(mobileBrand).toContainText('MedAtlas')
  await expect(page.locator('.clinical-sidebar-context')).toBeHidden()

  const [brandBox, navBox] = await Promise.all([
    mobileBrand.boundingBox(),
    mobileNav.boundingBox(),
  ])

  expect(brandBox).not.toBeNull()
  expect(navBox).not.toBeNull()
  expect(navBox!.y).toBeGreaterThan(brandBox!.y + brandBox!.height - 2)

  await expectNoHorizontalOverflow(page)
})


test('global command search navigates local MVP actions without backend', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 960 })
  await page.goto('/')

  await page.keyboard.press('Control+K')

  const search = page.getByRole('combobox', {
    name: 'Buscar paciente, relatório, anatomia ou módulo',
  })
  await expect(search).toBeFocused()

  const results = page.getByRole('listbox', {
    name: 'Resultados da busca global',
  })
  await expect(results).toBeVisible()
  await expect(results).toContainText('Novo relatório')

  await search.fill('coração')
  await expect(results).toContainText('Coração')

  const heartOption = results
    .getByRole('option')
    .filter({ hasText: 'Coração' })
    .first()
  await heartOption.click()

  await expect(
    page.getByRole('heading', {
      name: 'Adicionar laudo',
    }),
  ).toBeVisible()
  await expect(
    page.getByLabel('Texto do laudo ou relatório'),
  ).toContainText(/coração/i)

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  const mobileSearch = page.getByRole('combobox', {
    name: 'Buscar paciente, relatório, anatomia ou módulo',
  })
  await mobileSearch.fill('atlas')

  await expect(
    page.getByRole('listbox', {
      name: 'Resultados da busca global',
    }),
  ).toBeVisible()

  await expectNoHorizontalOverflow(page)
})


test('topbar utility controls perform useful local demo actions', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 960 })
  await page.goto('/')

  await page.getByRole('button', { name: 'Ações pendentes' }).click()
  const notifications = page.getByRole('dialog', {
    name: 'Ações pendentes do relatório',
  })
  await expect(notifications).toBeVisible()
  await expect(notifications).toContainText('Ações pendentes')
  await expect(notifications).toContainText('Publicar ao paciente')

  await notifications
    .getByRole('button', { name: /Publicar ao paciente/ })
    .click()
  await expect(
    page.getByRole('heading', {
      name: 'Adicionar laudo',
    }),
  ).toBeVisible()

  await page
    .getByRole('button', { name: 'Abrir menu do profissional' })
    .click()

  const profile = page.getByRole('dialog', {
    name: 'Perfil do profissional',
  })
  await expect(profile).toBeVisible()
  await expect(profile).toContainText('Administrador')
  await expect(profile).toContainText('Ortopedia')

  await profile
    .getByRole('button', { name: 'Equipe e permissões' })
    .click()
  await expect(
    page.getByRole('heading', {
      name: 'Equipe',
    }),
  ).toBeVisible()
})


test('professional and patient views are separated in the MVP', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 960 })
  await page.goto('/')

  await expect(page.locator('.clinical-sidebar')).toBeVisible()
  await expect(page.locator('.clinical-topbar')).toBeVisible()
  await expect(
    page.getByRole('group', { name: 'Alternar visão do MedAtlas' }),
  ).toHaveCount(0)

  await page
    .getByRole('button', { name: 'Abrir menu do profissional' })
    .click()
  await page
    .getByRole('button', { name: 'Visualizar como paciente' })
    .click()

  await expect(page.locator('.patient-shell')).toBeVisible()
  await expect(page.locator('.clinical-sidebar')).toHaveCount(0)
  await expect(
    page.getByText('VISÃO DO PACIENTE · PRÉVIA'),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Voltar ao profissional' }),
  ).toBeVisible()

  await page
    .getByRole('button', { name: 'Voltar ao profissional' })
    .click()

  await expect(page.locator('.clinical-sidebar')).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Atendimento em andamento' }),
  ).toBeVisible()
})

