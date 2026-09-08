import { expect, test } from '@playwright/test'

test('patient-facing focused 3D keeps the primary anatomy label in pt-BR', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  await page
    .getByRole('button', { name: 'Pacientes', exact: true })
    .first()
    .click()

  await expect(
    page.getByRole('heading', {
      name: 'Paciente atual',
    }),
  ).toBeVisible()

  const patientPreview = page.locator('.patient-anatomy-live')
  await expect(patientPreview).toBeVisible()

  await expect(
    patientPreview.getByText('3D carregado', { exact: true }),
  ).toBeVisible({ timeout: 60_000 })

  const hudLabel = patientPreview.locator(
    '.anatomy-focus-preview-hud strong',
  )

  await expect(hudLabel).toHaveText('Disco intervertebral L4–L5')
  await expect(patientPreview).not.toContainText(
    'intervertebral disk of fourth lumbar vertebra',
  )
})

test('clinical focused 3D HUD also uses the localized concept label', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 1000 })
  await page.goto('/')

  await page.getByRole('button', { name: 'Relatórios' }).click()

  await expect(
    page.getByRole('heading', { name: 'Adicionar laudo' }),
  ).toBeVisible()

  const clinicalAtlas = page.locator('.clinical-atlas-stage')
  await expect(clinicalAtlas.locator('canvas')).toBeVisible({
    timeout: 60_000,
  })

  const hudLabel = page.locator('.clinical-atlas-focus strong')
  await expect(hudLabel).toHaveText('Disco intervertebral L4–L5')
  await expect(page.locator('.clinical-atlas-card')).not.toContainText(
    'intervertebral disk of fourth lumbar vertebra',
  )
})
