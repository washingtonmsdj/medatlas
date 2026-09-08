import { expect, test } from '@playwright/test'

test('published MedAtlas preview loads the SaaS shell and real clinical 3D flow', async ({
  page,
}) => {
  await page.goto('./')

  await expect(
    page.getByRole('heading', {
      name: 'Seu fluxo clínico visual',
    }),
  ).toBeVisible()

  await expect(page).toHaveTitle(/Comunicação clínica visual em 3D/)

  const contextualSurfaces = [
    {
      button: null,
      selector: '.continue-care-card .anatomy-focus-preview',
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
    .filter({ hasText: 'FMA7088' })

  await expect(heartSuggestion).toContainText('Coração')
  await heartSuggestion
    .getByRole('button', { name: 'Confirmar estrutura' })
    .click()

  await expect(page.locator('.finding-card-studio.anatomy-confirmed')).toBeVisible()

  const focusedScene = page.locator('.clinical-atlas-stage .human-atlas-scene')
  await expect(focusedScene).toBeVisible()

  await expect
    .poll(
      async () =>
        focusedScene.locator('canvas').count(),
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
    name: 'Gerar explicação',
  })
  await expect(draftButton).toBeEnabled()
  await draftButton.click()

  await expect(page.getByLabel('Explicação para o paciente')).toContainText(
    'tórax',
  )

  await page
    .getByRole('button', { name: 'Ver como paciente' })
    .click()

  await expect(page.locator('.patient-shell')).toBeVisible()
  await expect(page.getByText('VISÃO DO PACIENTE · PRÉVIA')).toBeVisible()
  await expect(
    page.locator('#patient-anatomy .human-atlas-scene canvas'),
  ).toBeVisible({ timeout: 45_000 })

  await page
    .getByRole('group', { name: 'Alternar visão do MedAtlas' })
    .getByRole('button', { name: /Profissional/ })
    .click()

  await expect(
    page.getByRole('heading', { name: 'Adicionar laudo' }),
  ).toBeVisible()

  await page
    .getByRole('button', { name: 'Marcar como revisada' })
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


test('published full Atlas keeps the real 3D viewport primary on mobile', async ({
  page,
}) => {
  test.setTimeout(120_000)

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('./')

  await page.locator('.clinical-sidebar nav').getByRole('button', { name: 'Atlas 3D' }).click()

  await expect(
    page.getByRole('heading', { name: 'Atlas 3D' }),
  ).toBeVisible()

  await expect(
    page.getByText('Pronto', { exact: true }),
  ).toBeVisible({ timeout: 100_000 })

  const stage = page.locator('.reference-atlas-stage')
  const scene = stage.locator('.reference-atlas-scene')
  const canvas = scene.locator('canvas')

  await expect(canvas).toBeVisible({ timeout: 60_000 })

  const [stageBox, sceneBox] = await Promise.all([
    stage.boundingBox(),
    scene.boundingBox(),
  ])

  expect(stageBox).not.toBeNull()
  expect(sceneBox).not.toBeNull()
  expect(Math.abs(sceneBox!.y - stageBox!.y)).toBeLessThan(4)
  expect(sceneBox!.height).toBeGreaterThanOrEqual(
    stageBox!.height - 4,
  )

  const mobileTools = page.getByRole('navigation', {
    name: 'Ferramentas do Atlas no celular',
  })
  await expect(mobileTools).toBeVisible()

  const systems = page.getByRole('complementary', {
    name: 'Sistemas anatômicos',
  })
  const inspector = page.locator('.reference-inspector-card')

  await expect(systems).toBeHidden()
  await expect(inspector).toBeHidden()

  await mobileTools.getByRole('button', { name: /Camadas/ }).click()
  await expect(systems).toBeVisible()

  await page
    .getByRole('button', { name: 'Fechar camadas anatômicas' })
    .click()
  await expect(systems).toBeHidden()

  await mobileTools.getByRole('button', { name: /Estrutura/ }).click()
  await expect(inspector).toBeVisible()
})
