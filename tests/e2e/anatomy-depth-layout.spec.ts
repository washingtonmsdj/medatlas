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
