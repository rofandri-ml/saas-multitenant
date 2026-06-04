import { auth, clerkClient } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import { createProject } from './actions'

export default async function Page() {
  const { isAuthenticated, orgId, orgRole } = await auth()

  if (!isAuthenticated) {
    return <p className="p-8">Iniciá sesión para continuar.</p>
  }
  if (!orgId) {
    return <p className="p-8">Creá o seleccioná una organización para continuar.</p>
  }

  const client = await clerkClient()
  const organization = await client.organizations.getOrganization({ organizationId: orgId })
  const branding = (organization.publicMetadata ?? {}) as { tagline?: string; accentColor?: string }
  const accent = branding.accentColor ?? '#6c47ff'

  const projects = await prisma.project.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-1" style={{ color: accent }}>
        {organization.name}
      </h1>
      {branding.tagline && <p className="text-gray-600 mb-1">{branding.tagline}</p>}
      <p className="text-sm text-gray-500 mb-6">Tu rol: {orgRole}</p>

      <form action={createProject} className="flex gap-2 mb-6">
        <input
          name="name"
          placeholder="Nombre del proyecto"
          className="border rounded px-3 py-2 flex-1"
          required
        />
        <button type="submit" className="text-white rounded px-4 py-2" style={{ backgroundColor: accent }}>
          Crear
        </button>
      </form>

      <ul className="space-y-2">
        {projects.length === 0 ? (
          <li className="text-gray-500">Todavía no hay proyectos en esta organización.</li>
        ) : (
          projects.map((p) => (
            <li key={p.id} className="border rounded p-3">{p.name}</li>
          ))
        )}
      </ul>
    </main>
  )
}