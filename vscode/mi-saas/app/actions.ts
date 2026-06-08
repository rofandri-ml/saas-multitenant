'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { ownedOrAdminScope } from '@/lib/property-scope'
import { isSuperAdmin } from '@/lib/super-admin'
import { FREE_LIMIT } from '@/lib/plan'
import { del } from '@vercel/blob'
import { randomInt } from 'crypto'

// Parsea un campo numérico opcional del formulario: '' o inválido -> null.
function optionalInt(value: FormDataEntryValue | null): number | null {
  if (value === null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? Math.trunc(n) : null
}

// Alfabeto legible: sin caracteres ambiguos (0/O, 1/I/L) para que el código se
// pueda dictar o tipear sin confusiones.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function randomCode(length = 6): string {
  let out = ''
  for (let i = 0; i < length; i++) out += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]
  return out
}

// Genera un código público único; reintenta si colisiona (muy improbable).
async function generateUniqueCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = randomCode()
    const existing = await prisma.property.findUnique({ where: { code }, select: { id: true } })
    if (!existing) return code
  }
  throw new Error('No se pudo generar un código único para la propiedad')
}

export async function createProperty(formData: FormData) {
  const { userId, orgId, has } = await auth()
  if (!userId) return

  const title = (formData.get('title') as string)?.trim()
  const address = (formData.get('address') as string)?.trim()
  const locality = (formData.get('locality') as string)?.trim() || null
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

  const code = await generateUniqueCode()

  await prisma.property.create({
    data: {
      code, title, address, locality, price, operation, type, description,
      bedrooms, bathrooms, area, images,
      ownerId: userId,
      organizationId: orgId ?? null, // null = propietario directo
    },
  })

  revalidatePath('/dashboard')
  revalidatePath('/')
  redirect('/dashboard')
}

export async function updateProperty(formData: FormData) {
  const { userId, orgId, orgRole } = await auth()
  if (!userId) return

  const id = formData.get('id') as string
  if (!id) return

  const title = (formData.get('title') as string)?.trim()
  const address = (formData.get('address') as string)?.trim()
  const locality = (formData.get('locality') as string)?.trim() || null
  const price = Number(formData.get('price'))
  const operation = formData.get('operation') as string
  const type = formData.get('type') as string
  const description = (formData.get('description') as string)?.trim() || null
  const bedrooms = optionalInt(formData.get('bedrooms'))
  const bathrooms = optionalInt(formData.get('bathrooms'))
  const area = optionalInt(formData.get('area'))

  if (!title || !address || !price) return

  const images = formData.getAll('images').filter((v): v is string => typeof v === 'string')

  // Super Admin: god-mode (cualquier propiedad). Resto: scope de contexto.
  const where = ownedOrAdminScope(id, userId, orgId, orgRole, isSuperAdmin(userId))

  // Imágenes anteriores (mismo scope) para detectar las que se quitaron.
  const previous = await prisma.property.findFirst({ where, select: { images: true } })

  // Mismo scope que closeProperty: el dueño edita lo suyo; el admin, cualquiera de su org.
  // No se tocan ownerId/organizationId/status: solo el contenido editable.
  await prisma.property.updateMany({
    where,
    data: { title, address, locality, price, operation, type, description, bedrooms, bathrooms, area, images },
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

  revalidatePath('/dashboard')
  revalidatePath('/')
  redirect('/dashboard')
}

export async function deleteProperty(formData: FormData) {
  const { userId, orgId, orgRole } = await auth()
  if (!userId) return

  const id = formData.get('id') as string
  if (!id) return

  const superAdmin = isSuperAdmin(userId)

  // Borrar es irreversible: en una org solo el admin puede (el Super Admin, cualquiera).
  // (Sin org, el propietario directo borra lo suyo vía el scope.)
  if (orgId && orgRole !== 'org:admin' && !superAdmin) return

  const where = ownedOrAdminScope(id, userId, orgId, orgRole, superAdmin)

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

  revalidatePath('/dashboard')
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

  // El dueño cierra lo suyo; el admin cierra cualquiera de la org; el Super Admin, todas.
  await prisma.property.updateMany({
    where: ownedOrAdminScope(id, userId, orgId, orgRole, isSuperAdmin(userId)),
    data: { status },
  })

  revalidatePath('/dashboard')
  revalidatePath('/')
}

export async function reopenProperty(formData: FormData) {
  const { userId, orgId, orgRole } = await auth()
  if (!userId) return

  const id = formData.get('id') as string
  if (!id) return

  // Inverso de closeProperty: vuelve la propiedad a 'activa' (disponible).
  // El dueño reabre lo suyo; el admin cualquiera de la org; el Super Admin, todas.
  await prisma.property.updateMany({
    where: ownedOrAdminScope(id, userId, orgId, orgRole, isSuperAdmin(userId)),
    data: { status: 'activa' },
  })

  revalidatePath('/dashboard')
  revalidatePath('/')
}
