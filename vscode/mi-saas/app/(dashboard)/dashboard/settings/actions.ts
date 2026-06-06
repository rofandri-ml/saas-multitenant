'use server'

import { auth, clerkClient } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

export async function updateBranding(formData: FormData) {
  const { orgId, orgRole } = await auth()
  if (!orgId || orgRole !== 'org:admin') return // solo el admin

  const tagline = (formData.get('tagline') as string)?.trim() ?? ''
  const accentColor = (formData.get('accentColor') as string) ?? '#6c47ff'
  // Email donde llegan las consultas de la org (vacío = usar el del owner de cada aviso).
  const contactEmail = (formData.get('contactEmail') as string)?.trim() ?? ''

  const client = await clerkClient()
  await client.organizations.updateOrganizationMetadata(orgId, {
    publicMetadata: { tagline, accentColor, contactEmail },
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings')
}

// Cuenta personal (propietario individual): guarda el email de contacto para
// consultas en el publicMetadata del usuario de Clerk (sin migración).
export async function updateContactEmail(formData: FormData) {
  const { userId, orgId } = await auth()
  if (!userId || orgId) return // solo cuenta personal (sin org activa)

  const contactEmail = (formData.get('contactEmail') as string)?.trim() ?? ''

  const client = await clerkClient()
  await client.users.updateUserMetadata(userId, {
    publicMetadata: { contactEmail },
  })

  revalidatePath('/dashboard/settings')
}