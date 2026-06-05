'use server'

import { auth, clerkClient } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'

// Borrado de organización: destructivo e irreversible, solo para Super Admin.
export async function deleteOrganization(formData: FormData) {
  const { userId } = await auth()
  const superAdminIds = (process.env.SUPER_ADMIN_IDS ?? '')
    .split(',')
    .map((id) => id.trim())

  // Mismo chequeo que app/admin/page.tsx: solo el Super Admin puede borrar.
  if (!userId || !superAdminIds.includes(userId)) return

  const organizationId = formData.get('organizationId') as string
  if (!organizationId) return

  // Primero las propiedades de la org en nuestra base, luego la org en Clerk.
  await prisma.property.deleteMany({ where: { organizationId } })

  const client = await clerkClient()
  await client.organizations.deleteOrganization(organizationId)

  revalidatePath('/admin')
}
