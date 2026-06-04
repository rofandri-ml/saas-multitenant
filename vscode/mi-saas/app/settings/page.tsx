import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { updateBranding } from './actions'

export default async function SettingsPage() {
  const { orgId, orgRole } = await auth()

  if (!orgId) redirect('/')
  if (orgRole !== 'org:admin') redirect('/') // solo el admin del tenant

  const client = await clerkClient()
  const org = await client.organizations.getOrganization({ organizationId: orgId })
  const branding = (org.publicMetadata ?? {}) as { tagline?: string; accentColor?: string }

  return (
    <main className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Personalización de {org.name}</h1>
      <form action={updateBranding} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Lema</label>
          <input
            name="tagline"
            defaultValue={branding.tagline ?? ''}
            placeholder="Ej: Tu negocio, más simple"
            className="border rounded px-3 py-2 w-full"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Color de acento</label>
          <input
            type="color"
            name="accentColor"
            defaultValue={branding.accentColor ?? '#6c47ff'}
            className="h-10 w-16 p-1 border rounded"
          />
        </div>
        <button type="submit" className="bg-black text-white rounded px-4 py-2">
          Guardar
        </button>
      </form>
    </main>
  )
}