import { mkdir } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'

const MODULES = [
  {
    button: 'Visão geral',
    heading: 'Seu fluxo clínico visual',
  },
  {
    button: 'Relatórios',
    heading: 'Adicionar laudo',
  },
  {
    button: 'Pacientes',
    heading: 'Paciente atual',
  },
  {
    button: 'Equipe',
    heading: 'Equipe',
  },
  {
    button: 'Analytics',
    heading: 'Analytics',
  },
  {
    button: 'Configurações',
    heading: 'Configurações',
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
      name: 'Seu fluxo clínico visual',
    }),
  ).toBeVisible()
  await expect(
    page
      .locator('.continue-care-card')
      .getByText('3D carregado', { exact: true }),
  ).toBeVisible({ timeout: 60_000 })
  await capture(page, 'dashboard-1600')

  for (const module of MODULES) {
    await openModule(page, module)
    await expectNoHorizontalOverflow(page)

    const captureNames: Partial<Record<(typeof MODULES)[number]['button'], string>> = {
      Relatórios: 'clinical-studio-1600',
      Pacientes: 'patients-3d-1600',
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
      name: 'Seu fluxo clínico visual',
    }),
  ).toBeVisible()

  const skipLink = page.getByRole('link', {
    name: 'Ir para o conteúdo principal',
  })
  await expect(skipLink).toHaveCSS('opacity', '0')

  const dashboardMobile3dStage = page.locator(
    '.continue-care-card .anatomy-focus-preview-stage',
  )
  await expect(dashboardMobile3dStage).toBeVisible()

  const dashboardMobile3dStageBox =
    await dashboardMobile3dStage.boundingBox()
  expect(dashboardMobile3dStageBox).not.toBeNull()
  expect(dashboardMobile3dStageBox!.height).toBeGreaterThanOrEqual(400)

  await expect(
    page
      .locator('.continue-care-card')
      .getByText('3D carregado', { exact: true }),
  ).toBeVisible({ timeout: 60_000 })

  await capture(page, 'dashboard-mobile-390')

  for (const module of MODULES) {
    await openModule(page, module)
    await expectNoHorizontalOverflow(page)

    const captureNames: Partial<Record<(typeof MODULES)[number]['button'], string>> = {
      Relatórios: 'clinical-studio-mobile-390',
      Pacientes: 'patients-3d-mobile-390',
    }

    const captureName = captureNames[module.button]
    if (captureName) {
      await capture(page, captureName)
    }
  }
})

test('full Atlas 3D workbench stays usable from desktop to mobile', async ({
  page,
}) => {
  test.setTimeout(120_000)
  await page.setViewportSize({ width: 1600, height: 1000 })
  await page.goto('/')

  await page.locator('.clinical-sidebar nav').getByRole('button', { name: 'Atlas 3D' }).click()

  await expect(
    page.getByRole('heading', { name: 'Atlas 3D' }),
  ).toBeVisible()

  const atlasStatus = page.locator(
    '.reference-workbench-status > span',
  )
  await expect(atlasStatus).toBeVisible({ timeout: 20_000 })
  await expect(atlasStatus).toContainText(
    /Carregando|Pronto/,
  )

  await expect(
    page.getByText('Pronto', { exact: true }),
  ).toBeVisible({ timeout: 100_000 })

  const stage = page.locator('.reference-atlas-stage')
  const canvas = stage.locator('.reference-atlas-scene canvas')

  await expect(canvas).toBeVisible({ timeout: 60_000 })
  await expect(
    page.getByRole('complementary', { name: 'Sistemas anatômicos' }),
  ).toBeVisible()
  await expect(
    page.getByRole('navigation', {
      name: 'Controles de câmera do Atlas 3D',
    }),
  ).toBeVisible()

  await expectNoHorizontalOverflow(page)
  await capture(page, 'atlas-explorer-1600')

  await page.setViewportSize({ width: 1440, height: 960 })
  await page.waitForTimeout(250)
  await expectNoHorizontalOverflow(page)
  await expect(canvas).toBeVisible()
  await capture(page, 'atlas-explorer-1440')

  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(300)

  await expectNoHorizontalOverflow(page)
  await expect(canvas).toBeVisible()

  const mobileStageBox = await stage.boundingBox()
  expect(mobileStageBox).not.toBeNull()
  expect(mobileStageBox!.height).toBeGreaterThanOrEqual(740)

  const mobileSceneBox = await stage
    .locator('.reference-atlas-scene')
    .boundingBox()
  expect(mobileSceneBox).not.toBeNull()
  expect(
    Math.abs(mobileSceneBox!.y - mobileStageBox!.y),
  ).toBeLessThan(4)
  expect(mobileSceneBox!.height).toBeGreaterThanOrEqual(
    mobileStageBox!.height - 4,
  )

  const mobileControls = page.locator('.reference-view-controls')
  const mobileControlsBox = await mobileControls.boundingBox()
  expect(mobileControlsBox).not.toBeNull()
  expect(mobileControlsBox!.width).toBeGreaterThan(300)
  expect(mobileControlsBox!.height).toBeLessThan(70)

  const mobileTools = page.getByRole('navigation', {
    name: 'Ferramentas do Atlas no celular',
  })
  await expect(mobileTools).toBeVisible()
  const mobileToolsBox = await mobileTools.boundingBox()
  expect(mobileToolsBox).not.toBeNull()
  expect(mobileToolsBox!.width).toBeGreaterThan(300)

  const mobileSystems = page.getByRole('complementary', {
    name: 'Sistemas anatômicos',
  })
  const mobileInspector = page.locator('.reference-inspector-card')

  await expect(mobileSystems).toBeHidden()
  await expect(mobileInspector).toBeHidden()

  await mobileTools
    .getByRole('button', { name: /Camadas/ })
    .click()
  await expect(mobileSystems).toBeVisible()
  const mobileSystemsBox = await mobileSystems.boundingBox()
  expect(mobileSystemsBox).not.toBeNull()
  expect(mobileSystemsBox!.width).toBeGreaterThan(300)

  await page
    .getByRole('button', { name: 'Fechar camadas anatômicas' })
    .click()
  await expect(mobileSystems).toBeHidden()

  await mobileTools
    .getByRole('button', { name: /Estrutura/ })
    .click()
  await expect(mobileInspector).toBeVisible()

  await page
    .getByRole('button', { name: 'Fechar inspetor anatômico' })
    .click()
  await expect(mobileInspector).toBeHidden()

  await capture(page, 'atlas-explorer-mobile-390')
})


test('frontend refinement keeps hierarchy explicit on desktop and mobile', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 1000 })
  await page.goto('/')

  const metricIcons = page.locator('.premium-metrics .metric-icon')
  await expect(metricIcons).toHaveCount(4)
  for (let index = 0; index < 4; index += 1) {
    await expect(metricIcons.nth(index)).not.toHaveText('')
  }

  const dashboardStage = page.locator(
    '.continue-care-card .anatomy-focus-preview-stage',
  )
  await expect(dashboardStage).toBeVisible()
  const dashboardStageBox = await dashboardStage.boundingBox()
  expect(dashboardStageBox).not.toBeNull()
  expect(dashboardStageBox!.height).toBeGreaterThanOrEqual(300)

  await page.getByRole('button', { name: 'Relatórios' }).click()

  const currentStep = page.locator(
    '.workflow-strip-premium [data-step-state="current"]',
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
    name: 'Buscar paciente, exame, laudo ou módulo',
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
    name: 'Buscar paciente, exame, laudo ou módulo',
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

  await page.getByRole('button', { name: 'Ajuda' }).click()
  const help = page.getByRole('dialog', {
    name: 'Ajuda rápida do MedAtlas',
  })
  await expect(help).toBeVisible()
  await expect(help).toContainText('Confirme a anatomia')
  await expect(help).toContainText('Ctrl/⌘ K')

  await help
    .getByRole('button', { name: 'Abrir fluxo de relatório' })
    .click()
  await expect(
    page.getByRole('heading', {
      name: 'Adicionar laudo',
    }),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Notificações' }).click()
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

  const modeSwitcher = page.getByRole('group', {
    name: 'Alternar visão do MedAtlas',
  })
  await expect(modeSwitcher).toBeVisible()
  await expect(
    modeSwitcher.getByRole('button', { name: /Profissional/ }),
  ).toHaveAttribute('aria-pressed', 'true')

  await modeSwitcher.getByRole('button', { name: /Paciente/ }).click()

  await expect(page.locator('.patient-shell')).toBeVisible()
  await expect(page.locator('.clinical-sidebar')).toHaveCount(0)
  await expect(
    page.getByText('VISÃO DO PACIENTE · PRÉVIA'),
  ).toBeVisible()

  const patientModeSwitcher = page.getByRole('group', {
    name: 'Alternar visão do MedAtlas',
  })
  await patientModeSwitcher
    .getByRole('button', { name: /Profissional/ })
    .click()

  await expect(page.locator('.clinical-sidebar')).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Seu fluxo clínico visual' }),
  ).toBeVisible()
})
