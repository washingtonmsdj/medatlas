import { expect, test } from '@playwright/test'

test('published MedAtlas preview loads the SaaS shell and real clinical 3D flow', async ({
  page,
}) => {
  await page.goto('./')

  await expect(
    page.getByRole('heading', {
      name: 'Atendimento em andamento',
    }),
  ).toBeVisible()

  await expect(page).toHaveTitle(/Comunicação clínica visual em 3D/)

  const contextualSurfaces = [
    {
      button: null,
      selector: '.overview-atlas-panel .anatomy-focus-preview',
    },
    {
      button: 'Pacientes',
      selector: '.patient-anatomy-live .anatomy-focus-preview',
    },
  ]

  for (const surface of contextualSurfaces) {
    if (surface.button) {
      await page.getByRole('button', { name: surface.button, exact: true }).click()
    }

    const preview = page.locator(surface.selector)
    await expect(preview).toBeVisible()
    await expect(preview.locator('.human-atlas-scene canvas')).toBeVisible({
      timeout: 45_000,
    })
    await expect(
      preview.getByText('3D carregado', { exact: true }),
    ).toBeVisible({ timeout: 45_000 })
  }

  await page.getByRole('button', { name: 'Relatórios' }).click()
  await expect(
    page.getByRole('heading', { name: 'Adicionar laudo' }),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Coração', exact: true }).click()
  await page.getByRole('button', { name: 'Encontrar anatomia' }).click()

  const heartSuggestion = page
    .locator('.suggestion-item')
    .filter({ hasText: 'Coração' })

  await expect(heartSuggestion).toContainText('Coração')
  await heartSuggestion
    .getByRole('button', { name: 'Usar estrutura' })
    .click()

  await expect(page.locator('.finding-card-studio.anatomy-confirmed')).toBeVisible()

  const focusedScene = page.locator('.clinical-atlas-stage .human-atlas-scene')
  await expect(focusedScene).toBeVisible()

  await expect
    .poll(
      async () => focusedScene.locator('canvas').count(),
      {
        timeout: 45_000,
        message: 'Human Atlas canvas should render from deployed anatomy assets',
      },
    )
    .toBeGreaterThan(0)

  await expect(
    page.getByText('ESTRUTURA EM FOCO', { exact: true }),
  ).toBeVisible({ timeout: 45_000 })

  const draftButton = page.getByRole('button', {
    name: 'Gerar rascunho',
  })
  await expect(draftButton).toBeEnabled()
  await draftButton.click()

  await expect(page.getByLabel('Explicação para o paciente')).toContainText(
    'tórax',
  )

  await page
    .locator('.patient-preview-control')
    .getByRole('button', { name: 'Prévia do paciente' })
    .click()

  await expect(page.locator('.patient-shell')).toBeVisible()
  await expect(page.getByText('VISÃO DO PACIENTE · PRÉVIA')).toBeVisible()
  await expect(
    page.locator('#patient-anatomy .human-atlas-scene canvas'),
  ).toBeVisible({ timeout: 45_000 })

  const patientDepth = page.getByRole('navigation', {
    name: 'Nível da anatomia 3D',
  })
  await expect(patientDepth).toBeVisible()

  await patientDepth
    .getByRole('button', { name: 'Ver Coração em detalhe' })
    .click()

  await expect(
    page.locator(
      '#patient-anatomy .organ-detail-scene[data-organ="heart"] canvas',
    ),
  ).toBeVisible({ timeout: 45_000 })
  await expect(page.locator('.patient-organ-detail-safety')).toContainText(
    'não representa o corpo individual do paciente',
  )
  await expect(page.locator('.patient-shell')).not.toContainText('FMA7088')

  await patientDepth
    .getByRole('button', { name: 'Corpo completo' })
    .click()
  await expect(
    page.locator('#patient-anatomy .human-atlas-scene canvas'),
  ).toBeVisible({ timeout: 45_000 })

  await page
    .getByRole('button', { name: 'Voltar ao profissional' })
    .click()

  await expect(
    page.getByRole('heading', { name: 'Adicionar laudo' }),
  ).toBeVisible()

  await page
    .getByRole('button', { name: 'Aprovar explicação' })
    .click()

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
  await expect(
    patientPage.getByText('SEU RELATÓRIO VISUAL'),
  ).toBeVisible()
  await expect(
    patientPage.getByRole('heading', { name: 'Entenda seu exame — coração' }),
  ).toBeVisible()
  await expect(
    patientPage.locator('#patient-anatomy .human-atlas-scene canvas'),
  ).toBeVisible({ timeout: 45_000 })
})


test('published Atlas uses the concept body-plus-detail layout on mobile', async ({
  page,
}) => {
  test.setTimeout(120_000)

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('./')

  await page.getByRole('button', { name: 'Mais módulos' }).click()
  const mobileModules = page.locator('#clinical-sidebar-more-menu')
  await expect(mobileModules).toBeVisible()
  await mobileModules
    .getByRole('button', { name: 'Atlas 3D', exact: true })
    .click()

  const workspace = page.locator('.reference-atlas-workspace')
  const stage = page.locator('.reference-atlas-body-stage')
  const canvas = stage.locator('.reference-atlas-scene canvas')

  await expect(workspace).toBeVisible()
  await expect(canvas).toBeVisible({ timeout: 100_000 })

  const stageBox = await stage.boundingBox()
  expect(stageBox).not.toBeNull()
  expect(stageBox!.height).toBeGreaterThanOrEqual(600)

  await expect(
    page.getByRole('complementary', { name: 'Sistemas anatômicos' }),
  ).toBeVisible()
  await expect(
    page.getByRole('navigation', { name: 'Atalhos do Atlas 3D' }),
  ).toBeVisible()
  await expect(page.locator('.reference-atlas-detail-panel')).toBeVisible()

  const search = page.locator('#reference-atlas-search')
  await search.fill('Coração')
  await page
    .locator('.reference-atlas-results button')
    .filter({ hasText: 'FMA7088' })
    .first()
    .click()

  await expect(canvas).toBeVisible()
  await expect(
    page.locator(
      '.reference-atlas-organ-stage .organ-detail-scene[data-organ="heart"] canvas',
    ),
  ).toBeVisible({ timeout: 45_000 })

  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth + 1,
  )
  expect(overflow).toBe(false)
})
