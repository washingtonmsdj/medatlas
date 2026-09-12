import { expect, test } from '@playwright/test'

test('mobile navigation exposes off-screen modules through an explicit overflow control', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  const sidebar = page.locator('.clinical-sidebar')
  const more = sidebar.getByRole('button', { name: 'Mais módulos' })

  await expect(more).toBeVisible()
  await expect(more).toHaveAttribute('aria-expanded', 'false')

  const sidebarBox = await sidebar.boundingBox()
  const moreBox = await more.boundingBox()
  expect(sidebarBox).not.toBeNull()
  expect(moreBox).not.toBeNull()
  expect(moreBox!.x + moreBox!.width).toBeLessThanOrEqual(
    sidebarBox!.x + sidebarBox!.width + 1,
  )

  await more.click()
  await expect(more).toHaveAttribute('aria-expanded', 'true')

  const overflow = page.locator('#clinical-sidebar-more-menu')
  await expect(overflow).toBeVisible()
  await expect(
    overflow.getByRole('button', { name: 'Atlas 3D' }),
  ).toBeVisible()
  await expect(
    overflow.getByRole('button', { name: 'Equipe' }),
  ).toBeVisible()
  await expect(
    overflow.getByRole('button', { name: 'Analytics' }),
  ).toBeVisible()
  await expect(
    overflow.getByRole('button', { name: 'Configurações' }),
  ).toBeVisible()

  await overflow.getByRole('button', { name: 'Analytics' }).click()
  await expect(
    page.getByRole('heading', { name: 'Desempenho dos relatórios' }),
  ).toBeVisible()
  await expect(overflow).toHaveCount(0)

  await more.click()
  await page
    .locator('#clinical-sidebar-more-menu')
    .getByRole('button', { name: 'Configurações' })
    .click()

  await expect(
    page.getByRole('heading', { name: 'Configurações do workspace' }),
  ).toBeVisible()

  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1)
})
