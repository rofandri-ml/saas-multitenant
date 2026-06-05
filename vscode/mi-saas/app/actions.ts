'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { ownedOrAdminScope } from '@/lib/property-scope'
import { FREE_LIMIT } from '@/lib/plan'
import { del } from '@vercel/blob'

// Parsea un campo numérico opcional del formulario: '' o inválido -> null.
function optionalInt(value: FormDataEntryValue | null): number | null {
  if (value === null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? Math.trunc(n) : null
}

export async function createProperty(formData: FormData) {
  const { userId, orgId, has } = await auth()
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

  // Gating por plan: Free (y cuentas personales) hasta FREE_LIMIT; el feature lo libera.
  // El conteo usa el scope del contexto (org: toda la agencia; personal: lo propio).
  if (!has({ feature: 'unlimited_properties' })) {
    const count = await prisma.property.count({
      where: orgId ? { organizationId: orgId } : { ownerId: userId, organizationId: null },
    })
    if (count >= FREE_LIMIT) return
  }

  const images = formData.getAll('images').filter((v): v is string => typeof v === 'string')

  await prisma.property.create({
    data: {
      title, address, price, operation, type, description,
      bedrooms, bathrooms, area, images,
      ownerId: userId,
      organizationId: orgId ?? null, // null = propietario directo
    },
  })

  revalidatePath('/')
  redirect('/')
}

export async function updateProperty(formData: FormData) {
  const { userId, orgId, orgRole } = await auth()
  if (!userId) return

  const id = formData.get('id') as string
  if (!id) return

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

  const images = formData.getAll('images').filter((v): v is string => typeof v === 'string')

  const where = ownedOrAdminScope(id, userId, orgId, orgRole)

  // Imágenes anteriores (mismo scope) para detectar las que se quitaron.
  const previous = await prisma.property.findFirst({ where, select: { images: true } })

  // Mismo scope que closeProperty: el dueño edita lo suyo; el admin, cualquiera de su org.
  // No se tocan ownerId/organizationId/status: solo el contenido editable.
  await prisma.property.updateMany({
    where,
    data: { title, address, price, operation, type, description, bedrooms, bathrooms, area, images },
  })

  // Limpieza de blobs: borrar del store las imágenes que ya no se usan (best-effort).
  const removed = previous?.images.filter((url) => !images.includes(url)) ?? []
  if (removed.length) {
    try {
      await del(removed)
    } catch (e) {
      console.error('No se pudieron borrar los blobs quitados:', e)
    }
  }

  revalidatePath('/')
  redirect('/')
}

export async function deleteProperty(formData: FormData) {
  const { userId, orgId, orgRole } = await auth()
  if (!userId) return

  const id = formData.get('id') as string
  if (!id) return

  // Borrar es irreversible: en una org solo el admin puede.
  // (Sin org, el propietario directo borra lo suyo vía el scope.)
  if (orgId && orgRole !== 'org:admin') return

  const where = ownedOrAdminScope(id, userId, orgId, orgRole)

  // Tomamos las imágenes (con el mismo scope) antes de borrar la propiedad.
  const property = await prisma.property.findFirst({ where, select: { images: true } })

  await prisma.property.deleteMany({ where })

  // Limpieza de blobs huérfanos (best-effort: no frena la operación).
  if (property?.images.length) {
    try {
      await del(property.images)
    } catch (e) {
      console.error('No se pudieron borrar los blobs de la propiedad:', e)
    }
  }

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

export async function reopenProperty(formData: FormData) {
  const { userId, orgId, orgRole } = await auth()
  if (!userId) return

  const id = formData.get('id') as string
  if (!id) return

  // Inverso de closeProperty: vuelve la propiedad a 'activa' (disponible).
  // El dueño reabre lo suyo; el admin cualquiera de la org (lo resuelve el scope).
  await prisma.property.updateMany({
    where: ownedOrAdminScope(id, userId, orgId, orgRole),
    data: { status: 'activa' },
  })

  revalidatePath('/')
}
