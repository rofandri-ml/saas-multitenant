'use server'

import { revalidatePath } from 'next/cache'
import { clerkClient } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import { sendLeadNotification } from '@/lib/email'

export type LeadFormState = { status: 'idle' | 'success' | 'error'; error?: string }

// Límites de largo para los campos de la consulta (defensa básica de entrada).
const MAX_NAME = 120
const MAX_EMAIL = 200
const MAX_PHONE = 40
const MAX_MESSAGE = 1000

// Validación simple de email (no exhaustiva: filtra basura evidente).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isValidEmail(value: unknown): value is string {
  return typeof value === 'string' && EMAIL_RE.test(value)
}

// Email primario del usuario en Clerk (fallback de contacto).
function primaryEmailOf(user: {
  emailAddresses: { id: string; emailAddress: string }[]
  primaryEmailAddressId: string | null
}): string | null {
  const primary = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
  return primary?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? null
}

// Resuelve a dónde van las consultas de una propiedad:
//  - Organización: contactEmail del publicMetadata de la org.
//  - Propietario individual: contactEmail del publicMetadata del usuario.
//  - Si no hay uno configurado válido: el email del owner en Clerk.
async function resolveContactEmail(ownerId: string, organizationId: string | null): Promise<string | null> {
  const client = await clerkClient()

  if (organizationId) {
    const org = await client.organizations.getOrganization({ organizationId })
    const configured = (org.publicMetadata as { contactEmail?: unknown }).contactEmail
    if (isValidEmail(configured)) return configured
    const owner = await client.users.getUser(ownerId)
    return primaryEmailOf(owner)
  }

  const user = await client.users.getUser(ownerId)
  const configured = (user.publicMetadata as { contactEmail?: unknown }).contactEmail
  if (isValidEmail(configured)) return configured
  return primaryEmailOf(user)
}

// Consulta pública: cualquiera puede dejarla, sin login. Validamos los datos,
// limitamos el largo del mensaje y guardamos el Lead asociado a la propiedad.
export async function createLead(
  _prevState: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  const propertyId = (formData.get('propertyId') as string)?.trim()
  const name = (formData.get('name') as string)?.trim()
  const email = (formData.get('email') as string)?.trim()
  const phoneRaw = (formData.get('phone') as string)?.trim()
  const phone = phoneRaw || null
  const message = (formData.get('message') as string)?.trim()

  if (!propertyId || !name || !email || !message) {
    return { status: 'error', error: 'Completá nombre, email y mensaje.' }
  }
  if (name.length > MAX_NAME || email.length > MAX_EMAIL) {
    return { status: 'error', error: 'Nombre o email demasiado largos.' }
  }
  if (phone && phone.length > MAX_PHONE) {
    return { status: 'error', error: 'El teléfono es demasiado largo.' }
  }
  if (!EMAIL_RE.test(email)) {
    return { status: 'error', error: 'Ingresá un email válido.' }
  }
  if (message.length > MAX_MESSAGE) {
    return { status: 'error', error: `El mensaje no puede superar los ${MAX_MESSAGE} caracteres.` }
  }

  // La propiedad debe existir y estar activa (no se consultan avisos cerrados).
  const property = await prisma.property.findFirst({
    where: { id: propertyId, status: 'activa' },
    select: { id: true, title: true, code: true, ownerId: true, organizationId: true },
  })
  if (!property) {
    return { status: 'error', error: 'La propiedad ya no está disponible.' }
  }

  await prisma.lead.create({
    data: { propertyId: property.id, name, email, phone, message },
  })

  // El owner ve la nueva consulta en su panel.
  revalidatePath('/dashboard/consultas')

  // Notificación por email (best-effort: si falla, NO rompe el guardado del Lead).
  try {
    const to = await resolveContactEmail(property.ownerId, property.organizationId)
    if (to) {
      await sendLeadNotification({
        to,
        propertyTitle: property.title,
        propertyCode: property.code,
        name,
        email,
        phone,
        message,
      })
    }
  } catch (e) {
    console.error('No se pudo enviar el email de la consulta:', e)
  }

  return { status: 'success' }
}
