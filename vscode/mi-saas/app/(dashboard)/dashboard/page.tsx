import { auth, clerkClient } from '@clerk/nextjs/server'
import Link from 'next/link'
import Image from 'next/image'
import prisma from '@/lib/prisma'
import { deleteProperty, closeProperty, reopenProperty } from '@/app/actions'
import { DeletePropertyButton } from '@/app/delete-property-button'
import { FREE_LIMIT } from '@/lib/plan'
import { isSuperAdmin } from '@/lib/super-admin'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  StarIcon,
  PlusIcon,
  MapPinIcon,
  BedDoubleIcon,
  BathIcon,
  RulerIcon,
  PencilIcon,
  CheckIcon,
  RotateCcwIcon,
  ImageIcon,
  HomeIcon,
} from 'lucide-react'

// Colores de badge por status, según el mockup (desing/mockup-propiedades.html).
const statusStyles: Record<string, string> = {
  activa: 'bg-[#e0eae1] text-[#264e41]',
  vendida: 'bg-[#edddcf] text-[#8e4019]',
  alquilada: 'bg-[#efe3c5] text-[#7b500f]',
}

export default async function Page() {
  const { userId, orgId, orgRole, has } = await auth()

  if (!userId) {
    return <p className="text-muted-foreground">Iniciá sesión para continuar.</p>
  }

  // Super Admin: god-mode (ve y gestiona TODAS las propiedades, cross-tenant).
  const superAdmin = isSuperAdmin(userId)

  // Contexto: Super Admin (plataforma) / inmobiliaria (org activa) / propietario directo.
  let heading = 'Mis propiedades'
  let label = 'Tu portafolio'
  let tagline: string | undefined
  let accentColor: string | undefined
  if (superAdmin) {
    heading = 'Todas las propiedades'
    label = 'Vista de plataforma · Super Admin'
  } else if (orgId) {
    const client = await clerkClient()
    const org = await client.organizations.getOrganization({ organizationId: orgId })
    const branding = (org.publicMetadata ?? {}) as { tagline?: string; accentColor?: string }
    heading = org.name
    tagline = branding.tagline
    accentColor = branding.accentColor
  }

  const properties = await prisma.property.findMany({
    where: superAdmin
      ? {} // god-mode: todas, sin filtro de tenant
      : orgId
        ? { organizationId: orgId }
        : { ownerId: userId, organizationId: null },
    orderBy: { createdAt: 'desc' },
  })

  // Gating por plan (mismo conteo de contexto que createProperty valida en el servidor).
  // El Super Admin no tiene límite.
  const count = properties.length
  const unlimited = superAdmin || has({ feature: 'unlimited_properties' })
  const atLimit = !unlimited && count >= FREE_LIMIT

  // Permisos para la UI (el servidor es la frontera real). Super Admin: todo.
  const isOrgAdmin = orgRole === 'org:admin'
  const canDelete = superAdmin || !orgId || isOrgAdmin

  return (
    <>
      {/* Intro */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="text-[13px] font-bold uppercase tracking-[0.08em] text-terracotta">{label}</div>
          <h1 className="mt-1 font-serif text-4xl font-semibold text-primary" style={{ color: accentColor }}>{heading}</h1>
          {tagline && <p className="mt-1 max-w-[46ch] text-muted-foreground">{tagline}</p>}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1.5 text-[13px] font-semibold text-primary">
            <StarIcon className="size-3.5" />
            {unlimited ? 'Ilimitado' : `${count} de ${FREE_LIMIT}`}
          </span>
          {atLimit ? (
            <div className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm">
              <p className="text-muted-foreground">Alcanzaste el límite de tu plan ({FREE_LIMIT} propiedades).</p>
              <Link href="/dashboard/pricing" className="font-semibold text-primary underline underline-offset-2">
                Mejorá tu plan para publicar más
              </Link>
            </div>
          ) : (
            <Button asChild>
              <Link href="/dashboard/properties/new"><PlusIcon /> Publicar propiedad</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Listado */}
      {properties.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <HomeIcon className="size-6" />
          </div>
          <div>
            <p className="font-serif text-lg font-semibold text-foreground">Todavía no hay propiedades</p>
            <p className="mt-1 text-sm text-muted-foreground">Publicá tu primera propiedad para empezar tu portafolio.</p>
          </div>
          {!atLimit && (
            <Button asChild className="mt-1">
              <Link href="/dashboard/properties/new"><PlusIcon /> Publicar propiedad</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-6">
          {properties.map((p) => {
            // Cerrar: dueño, admin o Super Admin, solo si está activa.
            const canClose = p.status === 'activa' && (superAdmin || isOrgAdmin || p.ownerId === userId)
            // Reabrir: dueño, admin o Super Admin, cuando NO está activa.
            const canReopen = p.status !== 'activa' && (superAdmin || isOrgAdmin || p.ownerId === userId)
            // Editar: dueño, admin o Super Admin, sin importar el status.
            const canEdit = superAdmin || isOrgAdmin || p.ownerId === userId

            return (
              <Card key={p.id} className="gap-0 py-0 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <Link href={`/dashboard/properties/${p.id}`} className="flex flex-1 flex-col">
                <div className="relative aspect-[3/2] overflow-hidden bg-gradient-to-br from-[#ddd2bd] to-[#c9bca1]">
                  {p.images.length > 0 ? (
                    <Image
                      src={p.images[0]}
                      alt={p.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 360px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ImageIcon className="size-9 text-[#a99b81]" />
                    </div>
                  )}
                  <Badge className={cn('absolute left-3 top-3 gap-1.5 border-transparent capitalize', statusStyles[p.status] ?? '')}>
                    <span className="size-1.5 rounded-full bg-current" />
                    {p.status}
                  </Badge>
                  <span className="absolute right-3 top-3 rounded-md bg-black/55 px-2 py-0.5 font-mono text-xs font-semibold tracking-wider text-white backdrop-blur-sm">
                    {p.code}
                  </span>
                </div>

                <CardContent className="flex flex-1 flex-col px-5 pt-4 pb-5">
                  <div className="mb-2 flex gap-2">
                    <Badge variant="outline" className="border-[#c6d6cd] bg-accent capitalize text-primary">{p.operation}</Badge>
                    <Badge variant="secondary" className="capitalize text-muted-foreground">{p.type}</Badge>
                  </div>
                  <h3 className="font-serif text-xl font-semibold">{p.title}</h3>
                  <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPinIcon className="size-3.5 shrink-0" />
                    {p.locality ? `${p.locality} · ${p.address}` : p.address}
                  </div>
                  {p.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                  )}
                  {(p.bedrooms != null || p.bathrooms != null || p.area != null) && (
                    <div className="mt-3.5 flex flex-wrap gap-4 border-y border-border py-3 text-sm font-semibold">
                      {p.bedrooms != null && (
                        <span className="flex items-center gap-1.5"><BedDoubleIcon className="size-4 text-terracotta" /> {p.bedrooms} amb.</span>
                      )}
                      {p.bathrooms != null && (
                        <span className="flex items-center gap-1.5"><BathIcon className="size-4 text-terracotta" /> {p.bathrooms} baño{p.bathrooms === 1 ? '' : 's'}</span>
                      )}
                      {p.area != null && (
                        <span className="flex items-center gap-1.5"><RulerIcon className="size-4 text-terracotta" /> {p.area} m²</span>
                      )}
                    </div>
                  )}
                  <div className="mt-auto pt-3.5 font-serif text-2xl font-semibold text-primary">
                    ${p.price.toLocaleString('es-AR')}
                    {p.operation === 'alquiler' && (
                      <span className="ml-1 text-sm font-semibold text-muted-foreground">/ mes</span>
                    )}
                  </div>
                </CardContent>
                </Link>

                {(canEdit || canClose || canReopen || canDelete) && (
                  <CardFooter className="gap-2">
                    {canEdit && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/properties/${p.id}/edit`}><PencilIcon /> Editar</Link>
                      </Button>
                    )}
                    {canClose && (
                      <form action={closeProperty}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="operation" value={p.operation} />
                        <Button type="submit" variant="outline" size="sm" className="border-[#c6d6cd] text-primary hover:bg-accent hover:text-primary">
                          <CheckIcon /> Marcar {p.operation === 'venta' ? 'vendida' : 'alquilada'}
                        </Button>
                      </form>
                    )}
                    {canReopen && (
                      <form action={reopenProperty}>
                        <input type="hidden" name="id" value={p.id} />
                        <Button type="submit" variant="outline" size="sm" className="border-[#c6d6cd] text-primary hover:bg-accent hover:text-primary">
                          <RotateCcwIcon /> Disponible
                        </Button>
                      </form>
                    )}
                    {canDelete && (
                      <form action={deleteProperty} className="ml-auto">
                        <input type="hidden" name="id" value={p.id} />
                        <DeletePropertyButton title={p.title} />
                      </form>
                    )}
                  </CardFooter>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}
