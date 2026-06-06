'use server'

import { auth, clerkClient } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { del } from '@vercel/blob'

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

  // Juntar las imágenes de todas las propiedades de la org y limpiarlas del store
  // antes de borrar las propiedades y la org (best-effort: no frena la operación).
  const properties = await prisma.property.findMany({
    where: { organizationId },
    select: { images: true },
  })
  const allImages = properties.flatMap((p) => p.images)
  if (allImages.length) {
    try {
      await del(allImages)
    } catch (e) {
      console.error('No se pudieron borrar los blobs de la organización:', e)
    }
  }

  // Luego las propiedades en nuestra base y la org en Clerk.
  await prisma.property.deleteMany({ where: { organizationId } })

  const client = await clerkClient()
  await client.organizations.deleteOrganization(organizationId)

  revalidatePath('/dashboard/admin')
  revalidatePath('/')
}
