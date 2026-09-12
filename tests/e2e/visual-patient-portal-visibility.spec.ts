import { mkdir } from 'node:fs/promises'
import { expect, test } from '@playwright/test'

test('published patient portal renders anatomy when the stage enters the viewport', async ({
  page,
}) => {
  test.setTimeout(90_000)

  await page.goto('/')
  await page.getByRole('button', { name: 'Relatórios' }).click()

  await expect(
    page.getByRole('heading', { name: 'Adicionar laudo' }),
  ).toBeVisible()

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
  await expect(patientPage.getByText('SEU RELATÓRIO VISUAL')).toBeVisible()

  const anatomy = patientPage.locator('#patient-anatomy')
  const stage = anatomy.locator('.patient-atlas-stage')
  const canvas = stage.locator('.human-atlas-scene canvas')

  await stage.scrollIntoViewIfNeeded()
  await expect(canvas).toBeVisible({ timeout: 45_000 })
  await expect(
    anatomy.getByRole('heading', { name: 'Disco intervertebral L4–L5' }),
  ).toBeVisible()

  await patientPage.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      }),
  )

  await mkdir('test-results/visual-qa', { recursive: true })
  await stage.screenshot({
    path: 'test-results/visual-qa/patient-portal-anatomy-visible.png',
  })

  await patientPage.close()
})
