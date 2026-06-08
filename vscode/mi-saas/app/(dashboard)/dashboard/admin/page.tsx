import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { Building2Icon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { deleteOrganization } from './actions'
import { DeleteOrganizationButton } from './delete-organization-button'
import { isSuperAdmin } from '@/lib/super-admin'

export default async function AdminPage() {
  const { userId } = await auth()

  // Solo el Super Admin entra; cualquier otro vuelve al inicio
  if (!isSuperAdmin(userId)) {
    redirect('/dashboard')
  }

  const client = await clerkClient()
  const { data: organizations, totalCount } =
    await client.organizations.getOrganizationList({
      limit: 100,
      includeMembersCount: true,
    })

  // Conteo de propiedades por organización, desde tu base
  const grouped = await prisma.property.groupBy({
    by: ['organizationId'],
    _count: { _all: true },
  })
  const projectCounts = new Map(grouped.map((g) => [g.organizationId, g._count._all]))

  // Métricas de resumen, calculadas de los datos ya traídos (sin nuevas consultas).
  const totalProperties = grouped.reduce((sum, g) => sum + g._count._all, 0)
  const totalMembers = organizations.reduce((sum, o) => sum + (o.membersCount ?? 0), 0)
  const metrics = [
    { label: 'Inmobiliarias', value: totalCount },
    { label: 'Propiedades', value: totalProperties },
    { label: 'Miembros', value: totalMembers },
  ]

  return (
    <div className="rounded-2xl bg-slate-900 p-6 text-slate-100 ring-1 ring-slate-800 sm:p-8">
      <header className="mb-6">
        <h1 className="font-sans text-2xl font-semibold tracking-tight text-white">Panel de plataforma</h1>
        <p className="mt-1 text-sm text-slate-400">{totalCount} inmobiliarias en total</p>
      </header>

      {/* Tarjetas-resumen */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {metrics.map((m) => (
          <Card key={m.label} className="gap-1 bg-slate-800 px-5 text-slate-100 ring-slate-700">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{m.label}</div>
            <div className="text-3xl font-semibold tabular-nums">{m.value}</div>
          </Card>
        ))}
      </div>

      {/* Inmobiliarias */}
      <Card className="mt-6 gap-0 bg-slate-800 p-0 ring-slate-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="px-5 py-3 font-medium">Inmobiliaria</th>
              <th className="px-5 py-3 font-medium">Miembros</th>
              <th className="px-5 py-3 text-right font-medium">Propiedades</th>
              <th className="px-5 py-3 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/60">
            {organizations.map((org) => (
              <tr key={org.id} className="transition-colors hover:bg-slate-700/30">
                <td className="px-5 py-3">
                  <div className="font-medium text-slate-100">{org.name}</div>
                  <div className="font-mono text-xs text-slate-500">{org.id}</div>
                </td>
                <td className="px-5 py-3 tabular-nums text-slate-300">{org.membersCount ?? 0}</td>
                <td className="px-5 py-3 text-right">
                  <Badge className="border-transparent bg-slate-700 tabular-nums text-slate-100">
                    {projectCounts.get(org.id) ?? 0}
                  </Badge>
                </td>
                <td className="px-5 py-3 text-right">
                  <form action={deleteOrganization} className="inline-flex">
                    <input type="hidden" name="organizationId" value={org.id} />
                    <DeleteOrganizationButton name={org.name} />
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {organizations.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
            <Building2Icon className="size-8 text-slate-600" />
            <p className="text-sm text-slate-400">Todavía no hay inmobiliarias registradas.</p>
          </div>
        )}
      </Card>
    </div>
  )
}
