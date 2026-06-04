'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'

export async function createProject(formData: FormData) {
  const { orgId } = await auth()
  if (!orgId) return

  const name = (formData.get('name') as string)?.trim()
  if (!name) return

  await prisma.project.create({
    data: { name, organizationId: orgId },
  })

  revalidatePath('/')
}