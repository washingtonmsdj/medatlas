import { mkdir } from 'node:fs/promises'
import {
  expect,
  test,
  type Locator,
  type Page,
} from '@playwright/test'

const scenarios = [
  {
    label: 'Coluna lombar',
    conceptId: 'FMA16036',
    displayName: 'Disco intervertebral L4–L5',
  },
  {
    label: 'Rim',
    conceptId: 'FMA7203',
    displayName: 'Rins',
  },
  {
    label: 'Coração',
    conceptId: 'FMA7088',
    displayName: 'Coração',
  },
  {
    label: 'Ombro',
    conceptId: 'FMA9629',
    displayName: 'Supraespinal',
  },
]

async function openReports(page: import('@playwright/test').Page) {
  await page.goto('/')
  await expect(
    page.getByRole('heading', {
      name: 'Seu fluxo clínico visual',
    }),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Relatórios' }).click()

  await expect(
    page.getByRole('heading', {
      name: 'Adicionar laudo',
    }),
  ).toBeVisible()
}

async function expectRealContextual3D(
  page: import('@playwright/test').Page,
  selector: string,
) {
  const preview = page.locator(selector)
  await expect(preview).toBeVisible()
  await expect(preview.locator('.human-atlas-scene')).toBeVisible({
    timeout: 45_000,
  })
  await expect(preview.locator('canvas')).toBeVisible({
    timeout: 45_000,
  })
  await expect(
    preview.getByText('3D carregado', { exact: true }),
  ).toBeVisible({ timeout: 45_000 })
  await expect(
    preview.getByText(/clique numa peça para identificar/i),
  ).toBeVisible()
}


async function inspectVisibleAnatomyPart(
  page: Page,
  canvas: Locator,
) {
  await expect(canvas).toBeVisible({ timeout: 45_000 })
  await canvas.scrollIntoViewIfNeeded()
  const box = await canvas.boundingBox()
  expect(box).not.toBeNull()

  const candidatePoints = [
    [0.5, 0.58],
    [0.42, 0.58],
    [0.58, 0.58],
    [0.5, 0.68],
    [0.36, 0.62],
    [0.64, 0.62],
  ] as const

  const inspector = page.getByLabel(
    'Estrutura anatômica inspecionada',
  )

  for (const [x, y] of candidatePoints) {
    await page.mouse.move(
      box!.x + box!.width * x,
      box!.y + box!.height * y,
    )
    await page.waitForTimeout(90)

    const cursor = await canvas.evaluate(
      (element) => getComputedStyle(element).cursor,
    )

    if (cursor !== 'pointer') continue

    await canvas.click({
      position: {
        x: box!.width * x,
        y: box!.height * y,
      },
      force: true,
    })
    await page.waitForTimeout(180)

    if (await inspector.isVisible()) {
      return inspector
    }
  }

  throw new Error(
    'Expected at least one central canvas point to hit visible Human Atlas anatomy.',
  )
}

test('all synthetic scenarios surface the expected anatomy first', async ({
  page,
}) => {
  await openReports(page)

  for (const scenario of scenarios) {
    await page
      .getByRole('button', { name: scenario.label, exact: true })
      .click()

    await expect(
      page.getByText('Reconfirmação anatômica necessária'),
    ).toBeVisible()

    await page
      .getByRole('button', { name: 'Encontrar anatomia' })
      .click()

    const firstSuggestion = page.locator('.suggestion-item').first()

    await expect(firstSuggestion).toContainText(scenario.displayName)
    await expect(firstSuggestion).toContainText(scenario.conceptId)
  }
})

test('clinician review gate leads to a patient-facing visual report', async ({
  page,
}) => {
  await openReports(page)

  await page.getByRole('button', { name: 'Coração', exact: true }).click()
  await page.getByRole('button', { name: 'Encontrar anatomia' }).click()

  const heartSuggestion = page
    .locator('.suggestion-item')
    .filter({ hasText: 'FMA7088' })

  await expect(heartSuggestion).toContainText('Coração')
  await expect(heartSuggestion).toContainText('Alta confiança')
  await heartSuggestion
    .getByRole('button', { name: 'Confirmar estrutura' })
    .click()

  await expect(
    page.getByText('Coração', { exact: true }).first(),
  ).toBeVisible()

  const draftButton = page.getByRole('button', {
    name: 'Gerar explicação',
  })
  await expect(draftButton).toBeEnabled()
  await draftButton.click()

  const explanation = page.getByLabel('Explicação para o paciente')
  await expect(explanation).toContainText('tórax')
  await expect(
    page.getByText('Gerado pelo MedAtlas'),
  ).toBeVisible()

  const previewButton = page.getByRole('button', {
    name: 'Ver como paciente',
  })
  await expect(previewButton).toBeVisible()
  await previewButton.click()

  const patientPreview = page.getByRole('region', {
    name: 'Preview do paciente',
  })
  await expect(patientPreview).toBeVisible()
  await expect(patientPreview).toContainText('Coração')
  await expect(patientPreview).toContainText('FMA7088')
  await expect(
    patientPreview.locator('.human-atlas-scene canvas'),
  ).toBeVisible({ timeout: 45_000 })
  await expect(
    patientPreview.getByText('3D carregado', { exact: true }),
  ).toBeVisible({ timeout: 45_000 })
  await mkdir('test-results/visual-qa', { recursive: true })
  await page.screenshot({
    path: 'test-results/visual-qa/patient-preview-real-3d.png',
    fullPage: true,
  })

  const publishBeforeReview = page.getByRole('button', {
    name: 'Revise a explicação',
  })
  await expect(publishBeforeReview).toBeDisabled()

  await page
    .getByRole('button', { name: 'Marcar como revisada' })
    .click()

  const publish = page.getByRole('button', {
    name: 'Compartilhar com paciente',
  })
  await expect(publish).toBeEnabled()
  await publish.click()

  await expect(
    page.getByText('Link pronto'),
  ).toBeVisible()

  const [patientPage] = await Promise.all([
    page.waitForEvent('popup'),
    page
      .getByRole('button', { name: 'Abrir link' })
      .click(),
  ])

  await patientPage.waitForLoadState('domcontentloaded')
  await expect(
    patientPage.getByText('SEU RELATÓRIO VISUAL'),
  ).toBeVisible()
  await expect(
    patientPage.getByText('Clínica Horizonte', { exact: true }).first(),
  ).toBeVisible()
  await expect(
    patientPage.getByRole('heading', {
      name: 'Entenda seu exame — coração',
    }),
  ).toBeVisible()
  await expect(
    patientPage
      .locator('#patient-anatomy')
      .getByText('FMA7088', { exact: true }),
  ).toBeVisible()
  await expect(
    patientPage.getByRole('button', { name: 'Imprimir / salvar PDF' }),
  ).toBeVisible()
  await expect(
    patientPage.getByRole('navigation', {
      name: 'Controles da anatomia 3D de referência',
    }),
  ).toBeVisible()
  await expect(
    patientPage.locator('#patient-anatomy .human-atlas-scene canvas'),
  ).toBeVisible({ timeout: 45_000 })

  const patientCanvas = patientPage.locator(
    '#patient-anatomy .human-atlas-scene canvas',
  )
  const patientInspector = await inspectVisibleAnatomyPart(
    patientPage,
    patientCanvas,
  )
  await expect(patientInspector).toBeVisible()
  await expect(patientInspector).toContainText(
    'Identificação visual de anatomia humana de referência',
  )
  await expect(patientInspector).toContainText(
    'não representa o corpo individual do paciente',
  )
  await expect(
    patientPage.getByRole('navigation', {
      name: 'Navegar pelas partes do relatório',
    }),
  ).toBeVisible()
  await expect(
    patientPage.getByText('REVISADO', { exact: true }),
  ).toBeVisible()
  await expect(
    patientPage.getByRole('heading', {
      name: 'Perguntas úteis para levar ao profissional',
    }),
  ).toBeVisible()
  await patientPage.screenshot({
    path: 'test-results/visual-qa/patient-portal-real-3d.png',
    fullPage: true,
  })

  await patientPage.setViewportSize({ width: 390, height: 844 })
  await expect(
    patientPage.locator('#patient-anatomy .human-atlas-scene canvas'),
  ).toBeVisible({ timeout: 45_000 })

  await expect(
    patientPage.locator('.patient-shell'),
  ).toHaveAttribute('data-surface-priority', 'mobile-first')

  await expect(
    patientPage.locator('.patient-clinic').getByText('Clínica Horizonte', { exact: true }),
  ).toBeVisible()

  const patientMobilePdf = patientPage.getByRole('button', {
    name: 'Imprimir / salvar PDF',
  })
  await expect(patientMobilePdf).toBeVisible()
  const patientMobilePdfBox = await patientMobilePdf.boundingBox()
  expect(patientMobilePdfBox).not.toBeNull()
  expect(patientMobilePdfBox!.width).toBeGreaterThanOrEqual(44)
  expect(patientMobilePdfBox!.height).toBeGreaterThanOrEqual(44)

  const patientMobileStage = patientPage.locator('.patient-atlas-stage')
  const patientMobileStageBox = await patientMobileStage.boundingBox()
  expect(patientMobileStageBox).not.toBeNull()
  expect(patientMobileStageBox!.height).toBeGreaterThanOrEqual(500)

  const patientMobileControls = patientPage.locator(
    '.patient-atlas-controls',
  )
  const patientMobileControlsBox = await patientMobileControls.boundingBox()
  expect(patientMobileControlsBox).not.toBeNull()
  expect(patientMobileControlsBox!.width).toBeGreaterThan(300)
  expect(patientMobileControlsBox!.height).toBeLessThan(70)

  const patientControlBoxes = await patientMobileControls
    .getByRole('button')
    .evaluateAll((buttons) =>
      buttons.map((button) => {
        const box = button.getBoundingClientRect()
        return { width: box.width, height: box.height }
      }),
    )
  expect(patientControlBoxes.length).toBeGreaterThanOrEqual(5)
  for (const box of patientControlBoxes) {
    expect(box.width).toBeGreaterThanOrEqual(44)
    expect(box.height).toBeGreaterThanOrEqual(44)
  }

  for (const label of ['Anatomia', 'Explicação', 'Perguntas']) {
    const target = patientPage
      .getByRole('navigation', { name: 'Navegar pelas partes do relatório' })
      .getByRole('button', { name: label })
    const targetBox = await target.boundingBox()
    expect(targetBox).not.toBeNull()
    expect(targetBox!.height).toBeGreaterThanOrEqual(44)
  }

  const patientMobileOverflow = await patientPage.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth + 1,
  )
  expect(patientMobileOverflow).toBe(false)

  await patientPage.screenshot({
    path: 'test-results/visual-qa/patient-portal-mobile-real-3d.png',
    fullPage: true,
  })

  await patientPage.close()

  await page.getByRole('button', { name: 'Analytics' }).click()
  await expect(
    page.getByRole('heading', {
      name: 'Analytics',
    }),
  ).toBeVisible()

  const viewsMetric = page
    .locator('.analytics-metrics article')
    .filter({ hasText: 'VISUALIZAÇÕES' })
  await expect(viewsMetric.locator('strong')).not.toHaveText('0')

  const analyticsRow = page
    .locator('.analytics-report-row')
    .filter({ hasText: 'Entenda seu exame — coração' })
  await expect(analyticsRow).toBeVisible()
  await expect(analyticsRow.locator('.analytics-view-count')).not.toHaveText(
    '0',
  )
})


test('real Human Atlas stays visible across core MVP context surfaces', async ({
  page,
}) => {
  await page.goto('/')

  await expectRealContextual3D(
    page,
    '.continue-care-card .anatomy-focus-preview',
  )

  const surfaces = [
    {
      button: 'Pacientes',
      selector: '.patient-anatomy-live .anatomy-focus-preview',
    },
  ]

  for (const surface of surfaces) {
    await page.getByRole('button', { name: surface.button, exact: true }).click()
    await expectRealContextual3D(page, surface.selector)
  }
})

test('stale contextual 3D stays visible but explicitly requires reconfirmation', async ({
  page,
}) => {
  await openReports(page)

  await page.getByRole('button', { name: 'Rim', exact: true }).click()

  await expect(
    page.getByText('Reconfirmação anatômica necessária').first(),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Pacientes', exact: true }).click()

  const stalePreview = page.locator(
    '.patient-anatomy-live .anatomy-focus-preview',
  )

  await expect(stalePreview).toBeVisible()
  await expect(
    stalePreview.locator('.human-atlas-scene canvas'),
  ).toBeVisible({ timeout: 45_000 })
  await expect(
    stalePreview.locator('.anatomy-focus-preview-review-banner'),
  ).toContainText('Reconfirmação anatômica necessária')
  await expect(
    stalePreview.locator('.anatomy-focus-preview-review-banner'),
  ).toContainText('Confirme novamente esta referência')
})

test('patient 3D preview requires a fresh explicit open after anatomy changes', async ({
  page,
}) => {
  await openReports(page)

  await page.getByRole('button', { name: 'Coração', exact: true }).click()
  await page.getByRole('button', { name: 'Encontrar anatomia' }).click()
  await page
    .locator('.suggestion-item')
    .filter({ hasText: 'FMA7088' })
    .getByRole('button', { name: 'Confirmar estrutura' })
    .click()

  await page
    .getByRole('button', { name: 'Gerar explicação' })
    .click()
  await page
    .getByRole('button', { name: 'Ver como paciente' })
    .click()

  await expect(
    page.getByRole('region', { name: 'Preview do paciente' }),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Rim', exact: true }).click()
  await expect(
    page.getByRole('region', { name: 'Preview do paciente' }),
  ).toHaveCount(0)

  await page.getByRole('button', { name: 'Encontrar anatomia' }).click()
  await page
    .locator('.suggestion-item')
    .filter({ hasText: 'FMA7203' })
    .getByRole('button', { name: 'Confirmar estrutura' })
    .click()
  await page
    .getByRole('button', { name: 'Gerar explicação' })
    .click()

  await expect(
    page.getByRole('region', { name: 'Preview do paciente' }),
  ).toHaveCount(0)
  await expect(
    page.getByRole('button', {
      name: 'Ver como paciente',
    }),
  ).toBeVisible()
})

test('mobile workspace keeps the main clinical flow usable', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  await page.getByRole('button', { name: 'Relatórios' }).click()
  await expect(
    page.getByRole('heading', {
      name: 'Adicionar laudo',
    }),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Rim', exact: true }).click()
  await page.getByRole('button', { name: 'Encontrar anatomia' }).click()

  await expect(
    page.locator('.suggestion-item').first(),
  ).toContainText('FMA7203')

  const mobileDock = page.locator('.clinical-atlas-view-dock')
  await expect(mobileDock).toBeVisible()

  const mobileDockBox = await mobileDock.boundingBox()
  expect(mobileDockBox).not.toBeNull()
  expect(mobileDockBox!.width).toBeGreaterThan(250)
  expect(mobileDockBox!.height).toBeLessThan(60)
  expect(mobileDockBox!.width).toBeGreaterThan(
    mobileDockBox!.height * 4,
  )

  const hasHorizontalOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth + 1,
  )

  expect(hasHorizontalOverflow).toBe(false)
})


test('expired demo patient links fail closed', async ({ page }) => {
  await openReports(page)

  await page.getByRole('button', { name: 'Rim', exact: true }).click()
  await page.getByRole('button', { name: 'Encontrar anatomia' }).click()

  const kidneySuggestion = page
    .locator('.suggestion-item')
    .filter({ hasText: 'FMA7203' })

  await kidneySuggestion
    .getByRole('button', { name: 'Confirmar estrutura' })
    .click()

  await page
    .getByRole('button', { name: 'Gerar explicação' })
    .click()
  await page
    .getByRole('button', { name: 'Marcar como revisada' })
    .click()
  await page
    .getByRole('button', { name: 'Compartilhar com paciente' })
    .click()

  const shareUrl = await page.locator('.share-box code').innerText()
  const parsedShareUrl = new URL(shareUrl)
  const token =
    parsedShareUrl.searchParams.get('patient') ??
    parsedShareUrl.pathname.match(/\/p\/([^/]+)\/?$/)?.[1] ??
    null

  if (!token) {
    throw new Error('Expected patient share token in canonical URL')
  }

  expect(token).toMatch(/^[0-9a-f]{64}$/)

  await page.evaluate((shareToken) => {
    const key = `medatlas:demo:published:${shareToken}`
    const raw = window.localStorage.getItem(key)

    if (!raw) throw new Error('Expected demo share in localStorage')

    const stored = JSON.parse(raw)
    stored.expiresAt = new Date(Date.now() - 1_000).toISOString()
    window.localStorage.setItem(key, JSON.stringify(stored))
  }, token)

  await page.goto(shareUrl)

  await expect(
    page.getByRole('heading', {
      name: 'Este link de demonstração não está disponível.',
    }),
  ).toBeVisible()
  await expect(
    page.getByText('Falha segura preservada'),
  ).toBeVisible()
})


test('new visual report starts empty and fail-closed', async ({ page }) => {
  await page.goto('/')

  await page
    .getByRole('button', { name: 'Novo relatório' })
    .click()

  await expect(
    page.getByRole('heading', {
      name: 'Adicionar laudo',
    }),
  ).toBeVisible()

  await expect(
    page.getByLabel('Texto do laudo ou relatório'),
  ).toHaveValue('')

  await expect(
    page.getByRole('heading', {
      name: 'Nenhuma estrutura confirmada',
    }),
  ).toBeVisible()

  await expect(
    page.locator('.finding-card-studio.anatomy-empty'),
  ).toBeVisible()

  await expect(
    page.getByText('Nenhuma anatomia selecionada'),
  ).toBeVisible()

  await expect(
    page.getByRole('button', {
      name: 'Gerar explicação',
    }),
  ).toBeDisabled()

  await expect(
    page.getByRole('button', {
      name: 'Confirme a anatomia',
    }),
  ).toBeDisabled()

  await page.getByRole('button', { name: 'Coração', exact: true }).click()
  await page.getByRole('button', { name: 'Encontrar anatomia' }).click()

  const suggestion = page
    .locator('.suggestion-item')
    .filter({ hasText: 'FMA7088' })

  await expect(suggestion).toContainText('Coração')
  await suggestion
    .getByRole('button', { name: 'Confirmar estrutura' })
    .click()

  await expect(
    page.getByRole('button', {
      name: 'Gerar explicação',
    }),
  ).toBeEnabled()
})


test('dashboard progress follows the current report', async ({ page }) => {
  await page.goto('/')

  await expect(
    page.getByRole('heading', { name: 'Seu fluxo clínico visual' }),
  ).toBeVisible()
  await expect(page.locator('.care-progress')).toHaveAttribute('aria-valuenow', '3')

  await page.getByRole('button', { name: 'Novo relatório' }).click()
  await page.getByRole('button', { name: 'Visão geral' }).click()

  await expect(page.locator('.care-progress')).toHaveAttribute('aria-valuenow', '0')
})


test('demo settings can clear local patient shares', async ({ page }) => {
  await openReports(page)

  await page.getByRole('button', { name: 'Coração', exact: true }).click()
  await page.getByRole('button', { name: 'Encontrar anatomia' }).click()

  const suggestion = page
    .locator('.suggestion-item')
    .filter({ hasText: 'FMA7088' })

  await suggestion
    .getByRole('button', { name: 'Confirmar estrutura' })
    .click()
  await page
    .getByRole('button', { name: 'Gerar explicação' })
    .click()
  await page
    .getByRole('button', { name: 'Marcar como revisada' })
    .click()
  await page
    .getByRole('button', { name: 'Compartilhar com paciente' })
    .click()

  const shareUrl = await page.locator('.share-box code').innerText()

  await page.getByRole('button', { name: 'Configurações' }).click()

  await expect(
    page.getByRole('heading', {
      name: 'Configurações',
    }),
  ).toBeVisible()

  await expect(
    page.getByText('1', { exact: true }),
  ).toBeVisible()

  await page
    .getByRole('button', {
      name: 'Limpar links',
    })
    .click()

  await expect(
    page.getByText(/link\(s\) local\(is\) removido\(s\)/),
  ).toBeVisible()

  await page.goto(shareUrl)

  await expect(
    page.getByRole('heading', {
      name: 'Este link de demonstração não está disponível.',
    }),
  ).toBeVisible()
})


test('synthetic text file import stays local and resolves anatomy', async ({
  page,
}) => {
  await page.goto('/')

  await page
    .getByRole('button', { name: 'Novo relatório' })
    .click()

  await page
    .getByLabel('Importar laudo de texto sintético')
    .setInputFiles({
      name: 'laudo-demo.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from(
        'Relatório cardiológico sintético: avaliação do coração em anatomia de referência.',
        'utf8',
      ),
    })

  await expect(
    page.getByLabel('Texto do laudo ou relatório'),
  ).toContainText('coração')

  await expect(
    page.getByText('laudo-demo.txt', { exact: true }),
  ).toBeVisible()

  await page
    .getByRole('button', { name: 'Encontrar anatomia' })
    .click()

  await expect(
    page.locator('.suggestion-item').first(),
  ).toContainText('FMA7088')
})



test('patients module reflects only the current synthetic report context', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Pacientes' }).click()

  await expect(
    page.getByRole('heading', {
      name: 'Paciente atual',
    }),
  ).toBeVisible()

  await expect(
    page.getByText('Paciente demonstração', { exact: true }),
  ).toBeVisible()
  await expect(
    page.getByText('FMA16036', { exact: true }),
  ).toBeVisible()

  await page
    .getByRole('button', { name: 'Abrir relatório visual' })
    .click()

  await expect(
    page.getByRole('heading', {
      name: 'Adicionar laudo',
    }),
  ).toBeVisible()
})


test('required anatomy attribution is visible in clinician and patient surfaces', async ({
  page,
}) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Configurações' }).click()

  await expect(
    page.getByText(
      'BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.',
      { exact: false },
    ),
  ).toBeVisible()

  await expect(
    page.getByRole('link', { name: 'Licença BodyParts3D' }),
  ).toHaveAttribute(
    'href',
    'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html',
  )

  await page.getByRole('button', { name: 'Relatórios' }).click()
  await page.getByRole('button', { name: 'Coração', exact: true }).click()
  await page.getByRole('button', { name: 'Encontrar anatomia' }).click()

  const suggestion = page
    .locator('.suggestion-item')
    .filter({ hasText: 'FMA7088' })

  await suggestion
    .getByRole('button', { name: 'Confirmar estrutura' })
    .click()
  await page
    .getByRole('button', { name: 'Gerar explicação' })
    .click()
  await page
    .getByRole('button', { name: 'Marcar como revisada' })
    .click()
  await page
    .getByRole('button', { name: 'Compartilhar com paciente' })
    .click()

  const [patientPage] = await Promise.all([
    page.waitForEvent('popup'),
    page
      .getByRole('button', { name: 'Abrir link' })
      .click(),
  ])

  await patientPage.waitForLoadState('domcontentloaded')

  await expect(
    patientPage.getByText(
      'BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.',
      { exact: false },
    ),
  ).toBeVisible()
})


test('Atlas 3D uses the full Human Atlas reference explorer', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Atlas 3D', exact: true }).click()

  await expect(
    page.getByRole('heading', { name: 'Atlas 3D' }),
  ).toBeVisible()

  await expect(
    page.getByText('HUMAN ATLAS · MOTOR DE REFERÊNCIA'),
  ).toBeVisible()

  await expect(
    page.getByRole('complementary', { name: 'Sistemas anatômicos' }),
  ).toBeVisible()

  await expect(
    page.getByRole('navigation', {
      name: 'Controles de câmera do Atlas 3D',
    }),
  ).toBeVisible()

  await expect(
    page.getByLabel('Separar anatomia'),
  ).toBeVisible()

  await expect(
    page.getByText(/peças · .* conceitos · BodyParts3D/),
  ).toBeVisible()

  await expect(
    page.locator('.reference-inspector-card'),
  ).toBeVisible()

  await expect(
    page.getByRole('button', { name: 'Redefinir workspace' }),
  ).toBeVisible()
})


test('focused Human Atlas picking identifies a real part without changing the report', async ({
  page,
}) => {
  await openReports(page)

  await page.getByRole('button', { name: 'Coração', exact: true }).click()
  await page.getByRole('button', { name: 'Encontrar anatomia' }).click()

  await page
    .locator('.suggestion-item')
    .filter({ hasText: 'FMA7088' })
    .getByRole('button', { name: 'Confirmar estrutura' })
    .click()

  const canvas = page.locator(
    '.clinical-atlas-stage .human-atlas-scene canvas',
  )
  await expect(canvas).toBeVisible({ timeout: 45_000 })

  const inspector = await inspectVisibleAnatomyPart(page, canvas)
  await expect(inspector).toBeVisible()
  await expect(inspector).toContainText('ESTRUTURA INSPECIONADA')
  await expect(inspector).toContainText(
    'A anatomia confirmada do relatório não foi alterada.',
  )
  await mkdir('test-results/visual-qa', { recursive: true })
  await page.screenshot({
    path: 'test-results/visual-qa/focused-inspection-highlight.png',
    fullPage: true,
  })
  await expect(
    page.locator('.clinical-atlas-stage .human-atlas-scene canvas'),
  ).toHaveAttribute(
    'aria-label',
    /clique em uma estrutura para inspecionar/i,
  )

  await expect(
    page.locator('.finding-card-studio.anatomy-confirmed'),
  ).toContainText('FMA7088')
})

test('clinical report uses the same Human Atlas reference engine in focused mode', async ({
  page,
}) => {
  await openReports(page)

  await expect(
    page.locator(
      '.human-atlas-scene .reference-atlas-scene',
    ).first(),
  ).toBeVisible()

  await expect(
    page.getByRole('navigation', {
      name: 'Controles da visualização clínica 3D',
    }),
  ).toBeVisible()

  await expect(
    page.getByRole('button', { name: 'Vista frontal' }),
  ).toBeVisible()
})

test('team module mirrors source-first roles and keeps membership writes blocked', async ({
  page,
}) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Equipe' }).click()

  await expect(
    page.getByRole('heading', {
      name: 'Equipe',
    }),
  ).toBeVisible()

  const roster = page.getByRole('region', {
    name: 'Membros da organização',
  })

  await expect(roster).toContainText('Dr. Carlos Mendes')
  await expect(roster).toContainText('Administrador')
  await expect(roster).toContainText('Dra. Marina Freitas')
  await expect(roster).toContainText('Profissional clínico')
  await expect(roster).toContainText('João Silva')
  await expect(roster).toContainText('Equipe de apoio')

  const matrix = page.getByRole('table', {
    name: 'Matriz de permissões da equipe',
  })

  const adminRow = matrix.getByRole('row').filter({
    hasText: 'Administrador',
  })
  const clinicianRow = matrix.getByRole('row').filter({
    hasText: 'Profissional clínico',
  })
  const staffRow = matrix.getByRole('row').filter({
    hasText: 'Equipe de apoio',
  })

  await expect(adminRow.getByRole('cell', { name: 'Permitido', exact: true })).toHaveCount(3)
  await expect(clinicianRow.getByRole('cell', { name: 'Permitido', exact: true })).toHaveCount(2)
  await expect(clinicianRow.getByRole('cell', { name: 'Não permitido', exact: true })).toHaveCount(1)
  await expect(staffRow.getByRole('cell', { name: 'Permitido', exact: true })).toHaveCount(1)
  await expect(staffRow.getByRole('cell', { name: 'Não permitido', exact: true })).toHaveCount(2)

  await expect(
    page.getByRole('button', { name: 'Alterar papéis' }),
  ).toBeDisabled()
  await expect(
    page.getByRole('button', { name: 'Convidar membro' }),
  ).toBeDisabled()

  await expect(
    page.getByText('Permissões visíveis; mutações bloqueadas.'),
  ).toBeVisible()

  await expect(
    page.getByText('Unidades e workspaces clínicos'),
  ).toBeVisible()
  await expect(page.getByText('Unidade principal', { exact: true })).toBeVisible()
  await expect(page.getByText('Ortopedia', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('Cardiologia', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('Fisioterapia', { exact: true }).first()).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Gerenciar estrutura' }),
  ).toBeDisabled()
})

test('organization switcher changes the active clinical workspace locally', async ({
  page,
}) => {
  await page.goto('/')

  const switcher = page.getByRole('button', {
    name: 'Organização ativa: Clínica Horizonte, Ortopedia',
  })

  await expect(switcher).toBeVisible()
  await switcher.click()

  const dialog = page.getByRole('dialog', {
    name: 'Selecionar unidade e workspace',
  })

  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('Unidade principal')
  await expect(dialog).toContainText('Salvador · BA · BR')
  await expect(dialog).toContainText('organization_units')
  await expect(dialog).toContainText('clinical_workspaces')

  const cardiology = dialog.getByRole('button', {
    name: /Cardiologia/,
  })
  await expect(cardiology).toHaveAttribute('aria-pressed', 'false')
  await cardiology.click()

  await expect(
    page.getByRole('button', {
      name: 'Organização ativa: Clínica Horizonte, Cardiologia',
    }),
  ).toBeVisible()

  await expect(
    page.getByText(/CLÍNICA HORIZONTE · CARDIOLOGIA · UNIDADE PRINCIPAL/),
  ).toBeVisible()

  await expect(
    page.getByText(/Cardiologia · Unidade principal · demonstração/),
  ).toBeVisible()
})

test('settings expose source-first clinic branding without enabling mutations', async ({
  page,
}) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Configurações' }).click()

  await expect(
    page.getByRole('heading', {
      name: 'Configurações',
    }),
  ).toBeVisible()

  await expect(page.getByText('CLÍNICA')).toBeVisible()
  await expect(
    page.getByText('Clínica Horizonte', { exact: true }).first(),
  ).toBeVisible()
  await expect(page.getByText('#1769AA')).toBeVisible()

  await expect(
    page.getByRole('button', { name: 'Editar identidade' }),
  ).toBeDisabled()
})



test('Atlas 3D exposes canonical source links in the explorer', async ({ page }) => {
  await page.goto('/')

  await page
    .getByRole('button', { name: 'Atlas 3D', exact: true })
    .click()

  await expect(
    page.getByRole('navigation', { name: 'Fontes do Atlas 3D' }),
  ).toBeVisible()

  await expect(
    page.getByRole('link', { name: 'Human Atlas', exact: true }),
  ).toHaveAttribute(
    'href',
    'https://github.com/ashemag/human-atlas',
  )

  await expect(
    page.getByRole('link', { name: 'Licença BodyParts3D', exact: true }),
  ).toHaveAttribute(
    'href',
    'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html',
  )
})
