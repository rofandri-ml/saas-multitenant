import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'

export default async function AdminPage() {
  const { userId } = await auth()
  const superAdminIds = (process.env.SUPER_ADMIN_IDS ?? '')
    .split(',')
    .map((id) => id.trim())

  // Solo el Super Admin entra; cualquier otro vuelve al inicio
  if (!userId || !superAdminIds.includes(userId)) {
    redirect('/')
  }

  const client = await clerkClient()
  const { data: organizations, totalCount } =
    await client.organizations.getOrganizationList({
      limit: 100,
      includeMembersCount: true,
    })

  // Conteo de proyectos por organización, desde tu base
  const grouped = await prisma.property.groupBy({
    by: ['organizationId'],
    _count: { _all: true },
  })
  const projectCounts = new Map(grouped.map((g) => [g.organizationId, g._count._all]))

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Panel de Super Admin</h1>
      <p className="text-sm text-gray-500 mb-6">{totalCount} organizaciones en total</p>

      <ul className="space-y-2">
        {organizations.map((org) => (
          <li key={org.id} className="border rounded p-4 flex justify-between items-center">
            <div>
              <p className="font-semibold">{org.name}</p>
              <p className="text-sm text-gray-500">
                {org.membersCount ?? 0} miembros · {projectCounts.get(org.id) ?? 0} propiedades
              </p>
            </div>
            <span className="text-xs text-gray-400">{org.id}</span>
          </li>
        ))}
      </ul>
    </main>
  )
}