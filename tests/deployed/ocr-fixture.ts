import type { Page } from '@playwright/test'

export async function createSyntheticOcrPng(page: Page) {
  const base64 = await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1000
    canvas.height = 260
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas 2D unavailable')

    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.fillStyle = '#000000'
    context.font = '700 72px Arial, sans-serif'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText('LAUDO SINTETICO CORACAO', 500, 130)

    return canvas.toDataURL('image/png').split(',')[1]
  })

  return Buffer.from(base64, 'base64')
}
