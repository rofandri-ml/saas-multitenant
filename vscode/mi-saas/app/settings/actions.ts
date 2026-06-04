'use server'

import { auth, clerkClient } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

export async function updateBranding(formData: FormData) {
  const { orgId, orgRole } = await auth()
  if (!orgId || orgRole !== 'org:admin') return // solo el admin

  const tagline = (formData.get('tagline') as string)?.trim() ?? ''
  const accentColor = (formData.get('accentColor') as string) ?? '#6c47ff'

  const client = await clerkClient()
  await client.organizations.updateOrganizationMetadata(orgId, {
    publicMetadata: { tagline, accentColor },
  })

  revalidatePath('/')
  revalidatePath('/settings')
}