import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { ownedOrAdminScope } from '@/lib/property-scope'
import { isSuperAdmin } from '@/lib/super-admin'
import { updateProperty } from '@/app/actions'
import { PropertyForm } from '../../property-form'

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId, orgId, orgRole } = await auth()
  if (!userId) redirect('/dashboard')

  const { id } = await params

  // Mismo scope que las mutaciones: el findFirst solo alcanza lo que el usuario puede editar
  // (el Super Admin, cualquiera). Si no existe o no está en su contexto, al inicio.
  const property = await prisma.property.findFirst({
    where: ownedOrAdminScope(id, userId, orgId, orgRole, isSuperAdmin(userId)),
  })

  if (!property) redirect('/dashboard')

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-serif text-3xl font-semibold text-primary">Editar propiedad</h1>
      <PropertyForm action={updateProperty} property={property} submitLabel="Guardar cambios" />
    </div>
  )
}
