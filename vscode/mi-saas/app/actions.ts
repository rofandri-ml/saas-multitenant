'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'

// Parsea un campo numérico opcional del formulario: '' o inválido -> null.
function optionalInt(value: FormDataEntryValue | null): number | null {
  if (value === null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? Math.trunc(n) : null
}

// Conjunto de propiedades sobre las que el usuario puede operar (least privilege):
//  - sin org (propietario directo): solo las propias.
//  - org admin: todas las de la org.
//  - org member: solo las propias dentro de la org.
// SIEMPRE se combina con el id; nunca se opera por id solo.
function ownedOrAdminScope(
  id: string,
  userId: string,
  orgId: string | null | undefined,
  orgRole: string | null | undefined,
) {
  if (!orgId) return { id, ownerId: userId, organizationId: null }
  if (orgRole === 'org:admin') return { id, organizationId: orgId }
  return { id, organizationId: orgId, ownerId: userId }
}

export async function createProperty(formData: FormData) {
  const { userId, orgId } = await auth()
  if (!userId) return

  const title = (formData.get('title') as string)?.trim()
  const address = (formData.get('address') as string)?.trim()
  const price = Number(formData.get('price'))
  const operation = formData.get('operation') as string
  const type = formData.get('type') as string
  const description = (formData.get('description') as string)?.trim() || null
  const bedrooms = optionalInt(formData.get('bedrooms'))
  const bathrooms = optionalInt(formData.get('bathrooms'))
  const area = optionalInt(formData.get('area'))

  if (!title || !address || !price) return

  await prisma.property.create({
    data: {
      title, address, price, operation, type, description,
      bedrooms, bathrooms, area,
      ownerId: userId,
      organizationId: orgId ?? null, // null = propietario directo
    },
  })

  revalidatePath('/')
}

export async function deleteProperty(formData: FormData) {
  const { userId, orgId, orgRole } = await auth()
  if (!userId) return

  const id = formData.get('id') as string
  if (!id) return

  // Borrar es irreversible: en una org solo el admin puede.
  // (Sin org, el propietario directo borra lo suyo vía el scope.)
  if (orgId && orgRole !== 'org:admin') return

  await prisma.property.deleteMany({
    where: ownedOrAdminScope(id, userId, orgId, orgRole),
  })

  revalidatePath('/')
}

export async function closeProperty(formData: FormData) {
  const { userId, orgId, orgRole } = await auth()
  if (!userId) return

  const id = formData.get('id') as string
  const operation = formData.get('operation') as string
  if (!id) return

  // venta -> vendida; alquiler -> alquilada.
  const status = operation === 'venta' ? 'vendida' : 'alquilada'

  // El dueño cierra lo suyo; el admin cierra cualquiera de la org (lo resuelve el scope).
  await prisma.property.updateMany({
    where: ownedOrAdminScope(id, userId, orgId, orgRole),
    data: { status },
  })

  revalidatePath('/')
}
