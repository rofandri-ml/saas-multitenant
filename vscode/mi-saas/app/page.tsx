import { auth, clerkClient } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import { createProperty, deleteProperty, closeProperty } from './actions'
import { DeletePropertyButton } from './delete-property-button'

const statusStyles: Record<string, string> = {
  activa: 'bg-green-100 text-green-700',
  vendida: 'bg-blue-100 text-blue-700',
  alquilada: 'bg-amber-100 text-amber-700',
}

export default async function Page() {
  const { userId, orgId, orgRole } = await auth()

  if (!userId) {
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
      : { ownerId: userId, organizationId: null },
    orderBy: { createdAt: 'desc' },
  })

  // Permisos para la UI (el servidor es la frontera real; esto solo evita mostrar
  // botones que el rol no puede usar). Borrar: sin org el dueño, en org solo admin.
  const isOrgAdmin = orgRole === 'org:admin'
  const canDelete = !orgId || isOrgAdmin

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
        <div className="flex gap-3">
          <input name="bedrooms" type="number" min={0} placeholder="Dormitorios" className="border rounded px-3 py-2 flex-1" />
          <input name="bathrooms" type="number" min={0} placeholder="Baños" className="border rounded px-3 py-2 flex-1" />
          <input name="area" type="number" min={0} placeholder="Superficie (m²)" className="border rounded px-3 py-2 flex-1" />
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
          properties.map((p) => {
            const details = [
              p.bedrooms != null && `${p.bedrooms} dorm.`,
              p.bathrooms != null && `${p.bathrooms} baño${p.bathrooms === 1 ? '' : 's'}`,
              p.area != null && `${p.area} m²`,
            ].filter(Boolean).join(' · ')

            // Cerrar: el dueño cierra lo suyo; el admin cierra cualquiera de la org.
            const canClose = p.status === 'activa' && (isOrgAdmin || p.ownerId === userId)

            return (
              <li key={p.id} className="border rounded p-4">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{p.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusStyles[p.status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {p.status}
                    </span>
                  </div>
                  <span>${p.price.toLocaleString('es-AR')}</span>
                </div>
                <p className="text-sm text-gray-500">{p.address} · {p.operation} · {p.type}</p>
                {details && <p className="text-sm text-gray-500">{details}</p>}
                {p.description && <p className="text-sm mt-1">{p.description}</p>}

                {(canClose || canDelete) && (
                  <div className="flex gap-2 mt-3">
                    {canClose && (
                      <form action={closeProperty}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="operation" value={p.operation} />
                        <button type="submit" className="text-sm border rounded px-3 py-1">
                          Marcar como {p.operation === 'venta' ? 'vendida' : 'alquilada'}
                        </button>
                      </form>
                    )}
                    {canDelete && (
                      <form action={deleteProperty}>
                        <input type="hidden" name="id" value={p.id} />
                        <DeletePropertyButton title={p.title} className="text-sm border rounded px-3 py-1 text-red-600" />
                      </form>
                    )}
                  </div>
                )}
              </li>
            )
          })
        )}
      </ul>
    </main>
  )
}
