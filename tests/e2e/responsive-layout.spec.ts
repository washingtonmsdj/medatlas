import { mkdir } from 'node:fs/promises'
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
    button: 'Equipe',
    heading: 'Equipe e permissões da organização',
  },
  {
    button: 'Analytics',
    heading: 'Visualizações dos relatórios compartilhados',
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
      name: 'Visão geral do fluxo clínico visual.',
    }),
  ).toBeVisible()
  await capture(page, 'dashboard-1600')

  for (const module of MODULES) {
    await openModule(page, module)
    await expectNoHorizontalOverflow(page)

    const captureNames: Partial<Record<(typeof MODULES)[number]['button'], string>> = {
      Relatórios: 'clinical-studio-1600',
      Pacientes: 'patients-3d-1600',
      Consultas: 'consultations-3d-1600',
      Exames: 'documents-3d-1600',
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
      Consultas: 'consultations-3d-1440',
      Exames: 'documents-3d-1440',
    }

    const captureName = captureNames[module.button]
    if (captureName) {
      await capture(page, captureName)
    }
  }
})

test('mobile SaaS surfaces stay inside a 390px viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(
    page.getByRole('heading', {
      name: 'Visão geral do fluxo clínico visual.',
    }),
  ).toBeVisible()
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

  await page
    .getByRole('button', { name: 'Atlas 3D', exact: true })
    .click()

  await expect(
    page.getByRole('heading', { name: 'Atlas humano 3D' }),
  ).toBeVisible()

  await expect(
    page.getByText(/Preparando atlas|Atlas pronto/, { exact: true }),
  ).toBeVisible({ timeout: 20_000 })

  await expect(
    page.getByText('Atlas pronto', { exact: true }),
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
  expect(mobileStageBox!.height).toBeGreaterThan(900)

  const mobileControls = page.locator('.reference-view-controls')
  const mobileControlsBox = await mobileControls.boundingBox()
  expect(mobileControlsBox).not.toBeNull()
  expect(mobileControlsBox!.width).toBeGreaterThan(300)
  expect(mobileControlsBox!.height).toBeLessThan(70)

  const mobileSystems = page.getByRole('complementary', {
    name: 'Sistemas anatômicos',
  })
  const mobileSystemsBox = await mobileSystems.boundingBox()
  expect(mobileSystemsBox).not.toBeNull()
  expect(mobileSystemsBox!.width).toBeGreaterThan(300)

  const mobileInspector = page.locator('.reference-inspector-card')
  const mobileInspectorBox = await mobileInspector.boundingBox()
  const mobileSceneBox = await stage
    .locator('.reference-atlas-scene')
    .boundingBox()

  expect(mobileInspectorBox).not.toBeNull()
  expect(mobileSceneBox).not.toBeNull()
  expect(mobileSceneBox!.height).toBeGreaterThan(480)
  expect(mobileSceneBox!.y).toBeGreaterThanOrEqual(
    mobileInspectorBox!.y + mobileInspectorBox!.height + 8,
  )

  await capture(page, 'atlas-explorer-mobile-390')
})
