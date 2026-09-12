import { mkdir } from 'node:fs/promises'
import { expect, test } from '@playwright/test'

test('mobile dashboard renders anatomy after the 3D surface enters the viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  const preview = page.locator(
    '.overview-atlas-panel .anatomy-focus-preview',
  )
  const stage = preview.locator('.anatomy-focus-preview-stage')
  const canvas = stage.locator('.reference-atlas-scene canvas')

  await expect(stage).toBeVisible()
  await stage.scrollIntoViewIfNeeded()
  await expect(canvas).toBeVisible({ timeout: 60_000 })
  await expect(
    preview.getByText('3D carregado', { exact: true }),
  ).toBeVisible({ timeout: 60_000 })

  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve())
        })
      }),
  )

  await mkdir('test-results/visual-qa', { recursive: true })
  await preview.screenshot({
    path: 'test-results/visual-qa/dashboard-3d-mobile-visible-390.png',
  })
})
