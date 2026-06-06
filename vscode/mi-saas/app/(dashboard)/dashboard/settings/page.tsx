import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { updateBranding, updateContactEmail } from './actions'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SubmitButton } from '@/app/submit-button'

export default async function SettingsPage() {
  const { userId, orgId, orgRole } = await auth()
  if (!userId) redirect('/dashboard')

  const client = await clerkClient()

  // --- Cuenta personal (propietario individual): solo email de contacto ---
  if (!orgId) {
    const user = await client.users.getUser(userId)
    const contactEmail = (user.publicMetadata as { contactEmail?: string }).contactEmail ?? ''
    const primary = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
    const fallback = primary?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? 'tu email de Clerk'

    return (
      <div className="mx-auto max-w-xl">
        <h1 className="mb-6 font-serif text-3xl font-semibold text-primary">Ajustes</h1>
        <Card className="gap-0 p-6">
          <form action={updateContactEmail} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="contactEmail">Email de contacto para consultas</Label>
              <Input
                id="contactEmail"
                name="contactEmail"
                type="email"
                defaultValue={contactEmail}
                placeholder={fallback}
              />
              <p className="text-xs text-muted-foreground">
                A dónde te llegan las consultas de tus propiedades. Si lo dejás vacío, usamos {fallback}.
              </p>
            </div>
            <SubmitButton>Guardar</SubmitButton>
          </form>
        </Card>
      </div>
    )
  }

  // --- Organización (solo el admin) ---
  if (orgRole !== 'org:admin') redirect('/dashboard')

  const org = await client.organizations.getOrganization({ organizationId: orgId })
  const branding = (org.publicMetadata ?? {}) as {
    tagline?: string
    accentColor?: string
    contactEmail?: string
  }

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
          <div className="space-y-1.5">
            <Label htmlFor="contactEmail">Email de contacto para consultas</Label>
            <Input
              id="contactEmail"
              name="contactEmail"
              type="email"
              defaultValue={branding.contactEmail ?? ''}
              placeholder="consultas@tu-inmobiliaria.com"
            />
            <p className="text-xs text-muted-foreground">
              A dónde llegan las consultas de las propiedades de la agencia. Si lo dejás vacío,
              llegan al email de quien publicó cada aviso.
            </p>
          </div>
          <SubmitButton>Guardar</SubmitButton>
        </form>
      </Card>
    </div>
  )
}
