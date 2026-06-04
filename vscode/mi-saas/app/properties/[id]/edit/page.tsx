import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { ownedOrAdminScope } from '@/lib/property-scope'
import { updateProperty } from '@/app/actions'

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId, orgId, orgRole } = await auth()
  if (!userId) redirect('/')

  const { id } = await params

  // Mismo scope que las mutaciones: el findFirst solo alcanza lo que el usuario puede editar.
  // Si no existe o no está en su contexto, lo mandamos al inicio (no revelamos que existe).
  const property = await prisma.property.findFirst({
    where: ownedOrAdminScope(id, userId, orgId, orgRole),
  })

  if (!property) redirect('/')

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Editar propiedad</h1>

      <form action={updateProperty} className="space-y-3 border rounded p-4">
        <input type="hidden" name="id" value={property.id} />
        <input name="title" defaultValue={property.title} required className="border rounded px-3 py-2 w-full" />
        <input name="address" defaultValue={property.address} required className="border rounded px-3 py-2 w-full" />
        <input name="price" type="number" defaultValue={property.price} required className="border rounded px-3 py-2 w-full" />
        <div className="flex gap-3">
          <select name="operation" defaultValue={property.operation} className="border rounded px-3 py-2 flex-1">
            <option value="venta">Venta</option>
            <option value="alquiler">Alquiler</option>
          </select>
          <select name="type" defaultValue={property.type} className="border rounded px-3 py-2 flex-1">
            <option value="casa">Casa</option>
            <option value="departamento">Departamento</option>
            <option value="terreno">Terreno</option>
            <option value="local">Local</option>
          </select>
        </div>
        <div className="flex gap-3">
          <input name="bedrooms" type="number" min={0} defaultValue={property.bedrooms ?? ''} placeholder="Dormitorios" className="border rounded px-3 py-2 flex-1" />
          <input name="bathrooms" type="number" min={0} defaultValue={property.bathrooms ?? ''} placeholder="Baños" className="border rounded px-3 py-2 flex-1" />
          <input name="area" type="number" min={0} defaultValue={property.area ?? ''} placeholder="Superficie (m²)" className="border rounded px-3 py-2 flex-1" />
        </div>
        <textarea name="description" defaultValue={property.description ?? ''} placeholder="Descripción" rows={3} className="border rounded px-3 py-2 w-full" />
        <div className="flex gap-2">
          <button type="submit" className="text-white rounded px-4 py-2" style={{ backgroundColor: '#6c47ff' }}>
            Guardar cambios
          </button>
          <Link href="/" className="rounded px-4 py-2 border">
            Cancelar
          </Link>
        </div>
      </form>
    </main>
  )
}
