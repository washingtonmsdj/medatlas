import { expect, test } from '@playwright/test'

test('published MedAtlas preview loads the SaaS shell and real clinical 3D flow', async ({
  page,
}) => {
  await page.goto('./')

  await expect(
    page.getByRole('heading', {
      name: 'Visão geral do fluxo clínico visual.',
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
    {
      button: 'Consultas',
      selector: '.consultation-anatomy-live .anatomy-focus-preview',
    },
    {
      button: 'Exames',
      selector: '.documents-anatomy-live .anatomy-focus-preview',
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
    page.getByRole('heading', { name: 'Localizar anatomia mencionada' }),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Coração', exact: true }).click()
  await page.getByRole('button', { name: 'Sugerir estruturas' }).click()

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
    name: 'Gerar rascunho educacional',
  })
  await expect(draftButton).toBeEnabled()
  await draftButton.click()

  await expect(page.getByLabel('Explicação para o paciente')).toContainText(
    'tórax',
  )

  await page
    .getByRole('button', { name: 'Confirmar explicação revisada' })
    .click()

  const publish = page.getByRole('button', {
    name: 'Aprovar e gerar link do paciente',
  })
  await expect(publish).toBeEnabled()
  await publish.click()

  await expect(page.getByText('Link de demonstração gerado')).toBeVisible()

  const [patientPage] = await Promise.all([
    page.waitForEvent('popup'),
    page.getByRole('button', { name: 'Abrir visão do paciente' }).click(),
  ])

  await patientPage.waitForLoadState('domcontentloaded')
  await expect(
    patientPage.getByText('SEU EXAME, EXPLICADO VISUALMENTE'),
  ).toBeVisible()
  await expect(
    patientPage.getByRole('heading', { name: 'Entenda seu exame — coração' }),
  ).toBeVisible()
  await expect(
    patientPage.locator('#patient-anatomy .human-atlas-scene canvas'),
  ).toBeVisible({ timeout: 45_000 })
})
