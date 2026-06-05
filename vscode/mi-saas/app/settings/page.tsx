import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { updateBranding } from './actions'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export default async function SettingsPage() {
  const { orgId, orgRole } = await auth()

  if (!orgId) redirect('/')
  if (orgRole !== 'org:admin') redirect('/') // solo el admin del tenant

  const client = await clerkClient()
  const org = await client.organizations.getOrganization({ organizationId: orgId })
  const branding = (org.publicMetadata ?? {}) as { tagline?: string; accentColor?: string }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 font-serif text-3xl font-semibold text-primary">
        Personalización de {org.name}
      </h1>
      <Card className="gap-0 p-6">
        <form action={updateBranding} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="tagline">Lema</Label>
            <Input
              id="tagline"
              name="tagline"
              defaultValue={branding.tagline ?? ''}
              placeholder="Ej: Tu próximo hogar, con la confianza de siempre"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="accentColor">Color de acento</Label>
            <Input
              id="accentColor"
              type="color"
              name="accentColor"
              defaultValue={branding.accentColor ?? '#264e41'}
              className="h-10 w-16 cursor-pointer p-1"
            />
            <p className="text-xs text-muted-foreground">Se usa en el título de tu portafolio.</p>
          </div>
          <Button type="submit">Guardar</Button>
        </form>
      </Card>
    </div>
  )
}
