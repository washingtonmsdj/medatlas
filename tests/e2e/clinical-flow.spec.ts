import { expect, test } from '@playwright/test'

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
      name: 'Visão geral do fluxo clínico visual.',
    }),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Relatórios' }).click()

  await expect(
    page.getByRole('heading', {
      name: 'Localizar anatomia mencionada',
    }),
  ).toBeVisible()
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
      .getByRole('button', { name: 'Sugerir estruturas' })
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
  await page.getByRole('button', { name: 'Sugerir estruturas' }).click()

  const heartSuggestion = page
    .locator('.suggestion-item')
    .filter({ hasText: 'FMA7088' })

  await expect(heartSuggestion).toContainText('Coração')
  await heartSuggestion
    .getByRole('button', { name: 'Confirmar estrutura' })
    .click()

  await expect(
    page.getByText('Coração', { exact: true }).first(),
  ).toBeVisible()

  const draftButton = page.getByRole('button', {
    name: 'Gerar rascunho educacional',
  })
  await expect(draftButton).toBeEnabled()
  await draftButton.click()

  const explanation = page.getByLabel('Explicação para o paciente')
  await expect(explanation).toContainText('tórax')
  await expect(
    page.getByText('Rascunho educacional MedAtlas'),
  ).toBeVisible()

  const publishBeforeReview = page.getByRole('button', {
    name: 'Revise a explicação antes de publicar',
  })
  await expect(publishBeforeReview).toBeDisabled()

  await page
    .getByRole('button', { name: 'Confirmar explicação revisada' })
    .click()

  const publish = page.getByRole('button', {
    name: 'Aprovar e gerar link do paciente',
  })
  await expect(publish).toBeEnabled()
  await publish.click()

  await expect(
    page.getByText('Link de demonstração gerado'),
  ).toBeVisible()

  const [patientPage] = await Promise.all([
    page.waitForEvent('popup'),
    page
      .getByRole('button', { name: 'Abrir visão do paciente' })
      .click(),
  ])

  await patientPage.waitForLoadState('domcontentloaded')
  await expect(
    patientPage.getByText('SEU EXAME, EXPLICADO VISUALMENTE'),
  ).toBeVisible()
  await expect(
    patientPage.getByRole('heading', {
      name: 'Entenda seu exame — coração',
    }),
  ).toBeVisible()
  await expect(patientPage.getByText('FMA7088')).toBeVisible()
  await expect(
    patientPage.getByRole('button', { name: 'Imprimir / salvar PDF' }),
  ).toBeVisible()
  await expect(
    patientPage.getByRole('heading', {
      name: 'Perguntas úteis para levar ao profissional',
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
      name: 'Localizar anatomia mencionada',
    }),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Rim', exact: true }).click()
  await page.getByRole('button', { name: 'Sugerir estruturas' }).click()

  await expect(
    page.locator('.suggestion-item').first(),
  ).toContainText('FMA7203')

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
  await page.getByRole('button', { name: 'Sugerir estruturas' }).click()

  const kidneySuggestion = page
    .locator('.suggestion-item')
    .filter({ hasText: 'FMA7203' })

  await kidneySuggestion
    .getByRole('button', { name: 'Confirmar estrutura' })
    .click()

  await page
    .getByRole('button', { name: 'Gerar rascunho educacional' })
    .click()
  await page
    .getByRole('button', { name: 'Confirmar explicação revisada' })
    .click()
  await page
    .getByRole('button', { name: 'Aprovar e gerar link do paciente' })
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
})


test('new visual report starts empty and fail-closed', async ({ page }) => {
  await page.goto('/')

  await page
    .getByRole('button', { name: 'Novo relatório visual' })
    .click()

  await expect(
    page.getByRole('heading', {
      name: 'Localizar anatomia mencionada',
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
    page.getByText('Nenhuma anatomia selecionada'),
  ).toBeVisible()

  await expect(
    page.getByRole('button', {
      name: 'Gerar rascunho educacional',
    }),
  ).toBeDisabled()

  await expect(
    page.getByRole('button', {
      name: 'Confirme a anatomia antes de publicar',
    }),
  ).toBeDisabled()

  await page.getByRole('button', { name: 'Coração', exact: true }).click()
  await page.getByRole('button', { name: 'Sugerir estruturas' }).click()

  const suggestion = page
    .locator('.suggestion-item')
    .filter({ hasText: 'FMA7088' })

  await expect(suggestion).toContainText('Coração')
  await suggestion
    .getByRole('button', { name: 'Confirmar estrutura' })
    .click()

  await expect(
    page.getByRole('button', {
      name: 'Gerar rascunho educacional',
    }),
  ).toBeEnabled()
})


test('synthetic pilot checklist reflects report progress', async ({ page }) => {
  await page.goto('/')

  await expect(
    page.getByRole('heading', {
      name: 'Critérios de aceite do fluxo',
    }),
  ).toBeVisible()

  await expect(page.locator('.pilot-score')).toContainText('4/5')

  await page
    .getByRole('button', { name: 'Novo relatório visual' })
    .click()

  await page.getByRole('button', { name: 'Visão geral' }).click()

  await expect(page.locator('.pilot-score')).toContainText('0/5')
})


test('demo settings can clear local patient shares', async ({ page }) => {
  await openReports(page)

  await page.getByRole('button', { name: 'Coração', exact: true }).click()
  await page.getByRole('button', { name: 'Sugerir estruturas' }).click()

  const suggestion = page
    .locator('.suggestion-item')
    .filter({ hasText: 'FMA7088' })

  await suggestion
    .getByRole('button', { name: 'Confirmar estrutura' })
    .click()
  await page
    .getByRole('button', { name: 'Gerar rascunho educacional' })
    .click()
  await page
    .getByRole('button', { name: 'Confirmar explicação revisada' })
    .click()
  await page
    .getByRole('button', { name: 'Aprovar e gerar link do paciente' })
    .click()

  const shareUrl = await page.locator('.share-box code').innerText()

  await page.getByRole('button', { name: 'Configurações' }).click()

  await expect(
    page.getByRole('heading', {
      name: 'Ambiente sintético e controles locais',
    }),
  ).toBeVisible()

  await expect(
    page.getByText('1', { exact: true }),
  ).toBeVisible()

  await page
    .getByRole('button', {
      name: 'Limpar dados locais da demonstração',
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
    .getByRole('button', { name: 'Novo relatório visual' })
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
    .getByRole('button', { name: 'Sugerir estruturas' })
    .click()

  await expect(
    page.locator('.suggestion-item').first(),
  ).toContainText('FMA7088')
})
