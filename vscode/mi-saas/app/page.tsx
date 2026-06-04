import { auth, clerkClient } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import { createProperty } from './actions'

export default async function Page() {
  const { isAuthenticated, userId, orgId } = await auth()

  if (!isAuthenticated) {
    return <p className="p-8">Iniciá sesión para continuar.</p>
  }

  // Contexto: inmobiliaria (org activa) o propietario directo (cuenta personal)
  let heading = 'Mis propiedades'
  let accent = '#6c47ff'
  if (orgId) {
    const client = await clerkClient()
    const org = await client.organizations.getOrganization({ organizationId: orgId })
    const branding = (org.publicMetadata ?? {}) as { accentColor?: string }
    heading = org.name
    accent = branding.accentColor ?? accent
  }

  const properties = await prisma.property.findMany({
    where: orgId
      ? { organizationId: orgId }
      : { ownerId: userId!, organizationId: null },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6" style={{ color: accent }}>{heading}</h1>

      <form action={createProperty} className="space-y-3 mb-8 border rounded p-4">
        <input name="title" placeholder="Título (ej. Depto 2 ambientes en Palermo)" required className="border rounded px-3 py-2 w-full" />
        <input name="address" placeholder="Dirección" required className="border rounded px-3 py-2 w-full" />
        <input name="price" type="number" placeholder="Precio" required className="border rounded px-3 py-2 w-full" />
        <div className="flex gap-3">
          <select name="operation" className="border rounded px-3 py-2 flex-1">
            <option value="venta">Venta</option>
            <option value="alquiler">Alquiler</option>
          </select>
          <select name="type" className="border rounded px-3 py-2 flex-1">
            <option value="casa">Casa</option>
            <option value="departamento">Departamento</option>
            <option value="terreno">Terreno</option>
            <option value="local">Local</option>
          </select>
        </div>
        <textarea name="description" placeholder="Descripción" rows={3} className="border rounded px-3 py-2 w-full" />
        <button type="submit" className="text-white rounded px-4 py-2" style={{ backgroundColor: accent }}>
          Publicar propiedad
        </button>
      </form>

      <ul className="space-y-2">
        {properties.length === 0 ? (
          <li className="text-gray-500">Todavía no hay propiedades publicadas.</li>
        ) : (
          properties.map((p) => (
            <li key={p.id} className="border rounded p-4">
              <div className="flex justify-between">
                <span className="font-semibold">{p.title}</span>
                <span>${p.price.toLocaleString('es-AR')}</span>
              </div>
              <p className="text-sm text-gray-500">{p.address} · {p.operation} · {p.type}</p>
              {p.description && <p className="text-sm mt-1">{p.description}</p>}
            </li>
          ))
        )}
      </ul>
    </main>
  )
}