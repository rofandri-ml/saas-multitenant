import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { MailIcon, PhoneIcon, InboxIcon, UserIcon } from 'lucide-react'

export default async function ConsultasPage() {
  const { userId, orgId } = await auth()

  if (!userId) {
    return <p className="text-muted-foreground">Iniciá sesión para continuar.</p>
  }

  // Mismo scope de contexto que el resto: org → propiedades de la org;
  // personal → las propias. Las consultas se filtran por la propiedad asociada.
  const propertyScope = orgId
    ? { organizationId: orgId }
    : { ownerId: userId, organizationId: null }

  const leads = await prisma.lead.findMany({
    where: { property: propertyScope },
    include: { property: { select: { code: true, title: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <>
      <div className="mb-8">
        <div className="text-[13px] font-bold uppercase tracking-[0.08em] text-terracotta">Bandeja</div>
        <h1 className="mt-1 font-serif text-4xl font-semibold text-primary">Consultas</h1>
        <p className="mt-1 text-muted-foreground">
          {leads.length} {leads.length === 1 ? 'consulta recibida' : 'consultas recibidas'}.
        </p>
      </div>

      {leads.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <InboxIcon className="size-6" />
          </div>
          <div>
            <p className="font-serif text-lg font-semibold text-foreground">Todavía no hay consultas</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Cuando alguien consulte por una de tus propiedades, vas a verla acá.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {leads.map((lead) => (
            <Card key={lead.id} className="shadow-sm">
              <CardContent className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <UserIcon className="size-4 text-terracotta" />
                    {lead.name}
                  </div>
                  <time className="text-sm text-muted-foreground" dateTime={lead.createdAt.toISOString()}>
                    {lead.createdAt.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </time>
                </div>

                <div className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                  <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 hover:text-foreground">
                    <MailIcon className="size-3.5" /> {lead.email}
                  </a>
                  {lead.phone && (
                    <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 hover:text-foreground">
                      <PhoneIcon className="size-3.5" /> {lead.phone}
                    </a>
                  )}
                </div>

                <p className="mt-3 whitespace-pre-line text-foreground">{lead.message}</p>

                <div className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground">
                  Sobre{' '}
                  <Link
                    href={`/propiedades/${lead.property.code}`}
                    className="font-medium text-primary underline underline-offset-2"
                  >
                    {lead.property.title}
                  </Link>{' '}
                  <span className="font-mono text-xs">({lead.property.code})</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
