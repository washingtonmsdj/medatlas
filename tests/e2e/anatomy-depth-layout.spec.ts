import { expect, test } from '@playwright/test'

test('clinical anatomy depth controls keep separate hit areas on desktop', async ({
  page,
}) => {
  test.setTimeout(90_000)

  for (const viewport of [
    { width: 1600, height: 1000 },
    { width: 1440, height: 960 },
  ]) {
    await page.setViewportSize(viewport)
    await page.goto('/')

    await page.getByRole('button', { name: 'Relatórios' }).click()
    await page.getByRole('button', { name: 'Coração', exact: true }).click()
    await page.getByRole('button', { name: 'Encontrar anatomia' }).click()
    await page
      .locator('.suggestion-item')
      .filter({ hasText: 'Coração' })
      .getByRole('button', { name: 'Usar estrutura' })
      .click()

    const depth = page.getByRole('navigation', {
      name: 'Nível anatômico do relatório',
    })
    const body = depth.getByRole('button', { name: /^Corpo/ })
    const detail = depth.getByRole('button', { name: /Órgão em detalhe/ })

    await expect(depth).toBeVisible()
    await expect(body).toBeVisible()
    await expect(detail).toBeVisible()

    const [depthBox, bodyBox, detailBox] = await Promise.all([
      depth.boundingBox(),
      body.boundingBox(),
      detail.boundingBox(),
    ])

    expect(depthBox).not.toBeNull()
    expect(bodyBox).not.toBeNull()
    expect(detailBox).not.toBeNull()

    const epsilon = 1

    expect(bodyBox!.x).toBeGreaterThanOrEqual(depthBox!.x - epsilon)
    expect(detailBox!.x + detailBox!.width).toBeLessThanOrEqual(
      depthBox!.x + depthBox!.width + epsilon,
    )

    expect(bodyBox!.x + bodyBox!.width).toBeLessThanOrEqual(
      detailBox!.x + epsilon,
    )

    expect(bodyBox!.height).toBeGreaterThanOrEqual(34)
    expect(detailBox!.height).toBeGreaterThanOrEqual(34)
  }
})

test('Atlas explains unavailable supplemental detail without asking to replace confirmed anatomy', async ({
  page,
}) => {
  test.setTimeout(90_000)
  await page.setViewportSize({ width: 1440, height: 960 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Atlas 3D', exact: true }).click()

  const detailPanel = page.getByLabel('Detalhe anatômico')
  await expect(detailPanel).toBeVisible()
  await expect(
    detailPanel.getByText('Detalhe 3D adicional não disponível', { exact: true }),
  ).toBeVisible({ timeout: 45_000 })
  await expect(detailPanel).toContainText(
    'Disco intervertebral L4–L5 continua disponível no corpo completo do Human Atlas.',
  )
  await expect(
    detailPanel.getByText('Selecione um órgão compatível', { exact: true }),
  ).toHaveCount(0)

  const detailToggle = page
    .getByRole('group', { name: 'Nível anatômico' })
    .getByRole('button', { name: 'Órgão em detalhe' })
  await expect(detailToggle).toBeDisabled()

  await page
    .getByRole('navigation', { name: 'Atalhos do Atlas 3D' })
    .getByRole('button', { name: 'Coração' })
    .click()

  await expect(detailToggle).toBeEnabled()
  await expect(
    detailPanel.getByText('Modelo anatômico detalhado', { exact: true }),
  ).toBeVisible()
})
