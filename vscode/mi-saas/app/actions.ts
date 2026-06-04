'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'

export async function createProperty(formData: FormData) {
  const { userId, orgId } = await auth()
  if (!userId) return

  const title = (formData.get('title') as string)?.trim()
  const address = (formData.get('address') as string)?.trim()
  const price = Number(formData.get('price'))
  const operation = formData.get('operation') as string
  const type = formData.get('type') as string
  const description = (formData.get('description') as string)?.trim() || null

  if (!title || !address || !price) return

  await prisma.property.create({
    data: {
      title, address, price, operation, type, description,
      ownerId: userId,
      organizationId: orgId ?? null, // null = propietario directo
    },
  })

  revalidatePath('/')
}