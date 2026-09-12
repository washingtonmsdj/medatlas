import { expect, test } from '@playwright/test'

test('desktop navigation exposes modules directly without overflow duplication', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 960 })
  await page.goto('/')

  const sidebar = page.locator('.clinical-sidebar')
  const primaryNav = sidebar.getByRole('navigation', {
    name: 'Navegação principal',
  })

  await expect(
    sidebar.getByRole('button', { name: 'Mais módulos' }),
  ).toBeHidden()
  await expect(
    primaryNav.getByRole('button', { name: 'Laudos · Relatórios visuais' }),
  ).toBeVisible()
  await expect(
    primaryNav.getByRole('button', { name: 'Atlas 3D' }),
  ).toBeVisible()
  await expect(
    primaryNav.getByRole('button', { name: 'Equipe' }),
  ).toBeVisible()
  await expect(
    primaryNav.getByRole('button', { name: 'Analytics' }),
  ).toBeVisible()
  await expect(
    primaryNav.getByRole('button', { name: 'Configurações' }),
  ).toBeVisible()
})

test('mobile navigation exposes secondary modules only through an explicit overflow control', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  const sidebar = page.locator('.clinical-sidebar')
  const primaryNav = sidebar.getByRole('navigation', {
    name: 'Navegação principal',
  })
  const more = sidebar.getByRole('button', { name: 'Mais módulos' })

  await expect(more).toBeVisible()
  await expect(more).toHaveAttribute('aria-expanded', 'false')
  await expect(
    primaryNav.getByRole('button', { name: 'Visão geral' }),
  ).toBeVisible()
  await expect(
    primaryNav.getByRole('button', { name: 'Pacientes' }),
  ).toBeVisible()

  const mobileOverflowItems = primaryNav.locator(
    '.clinical-sidebar-mobile-overflow-item',
  )
  await expect(mobileOverflowItems).toHaveCount(5)
  for (let index = 0; index < 5; index += 1) {
    await expect(mobileOverflowItems.nth(index)).toBeHidden()
  }

  const navGeometry = await primaryNav.evaluate((element) => ({
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
    scrollLeft: element.scrollLeft,
  }))
  expect(navGeometry.scrollWidth).toBeLessThanOrEqual(navGeometry.clientWidth + 1)
  expect(navGeometry.scrollLeft).toBe(0)

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
    overflow.getByRole('button', { name: 'Laudos' }),
  ).toBeVisible()
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
  await expect(more).toHaveClass(/active/)

  const activeNavGeometry = await primaryNav.evaluate((element) => ({
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
    scrollLeft: element.scrollLeft,
  }))
  expect(activeNavGeometry.scrollWidth).toBeLessThanOrEqual(
    activeNavGeometry.clientWidth + 1,
  )
  expect(activeNavGeometry.scrollLeft).toBe(0)

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
