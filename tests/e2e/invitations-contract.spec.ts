import { expect, test } from '@playwright/test'

test('team invitation contract is visible while transport remains fail-closed', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Equipe' }).click()

  const invitationContract = page.getByRole('region', {
    name: 'Contrato seguro de convites',
  })

  await expect(invitationContract).toBeVisible()
  await expect(invitationContract).toContainText('Somente administrador')
  await expect(invitationContract).toContainText('Token não persistido')
  await expect(invitationContract).toContainText('Aceite vinculado ao e-mail')
  await expect(invitationContract).toContainText('Expira, revoga e audita')
  await expect(invitationContract).toContainText(
    'Nenhum e-mail é enviado e nenhum membro é criado no modo demo.',
  )
  await expect(invitationContract).toContainText(
    'organization_invitations · migration 005',
  )

  await expect(
    page.getByRole('button', { name: 'Convidar membro' }),
  ).toBeDisabled()
})
