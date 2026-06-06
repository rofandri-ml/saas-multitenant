import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ArrowLeftIcon,
  MapPinIcon,
  BedDoubleIcon,
  BathIcon,
  RulerIcon,
  ImageIcon,
  PencilIcon,
} from 'lucide-react'
import { Gallery } from '@/components/gallery'

const statusStyles: Record<string, string> = {
  activa: 'bg-[#e0eae1] text-[#264e41]',
  vendida: 'bg-[#edddcf] text-[#8e4019]',
  alquilada: 'bg-[#efe3c5] text-[#7b500f]',
}

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId, orgId, orgRole } = await auth()
  if (!userId) redirect('/dashboard')

  const { id } = await params

  // Scope de contexto (igual que el listado del home): cualquier propiedad visible en
  // la lista se puede abrir. Lo cross-tenant queda afuera (org activa, o personal + null).
  const property = await prisma.property.findFirst({
    where: orgId
      ? { id, organizationId: orgId }
      : { id, ownerId: userId, organizationId: null },
  })

  if (!property) redirect('/dashboard')

  // Solo para mostrar el botón de editar (la frontera real es la Server Action).
  const canEdit = orgRole === 'org:admin' || property.ownerId === userId

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/dashboard"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" /> Volver al listado
      </Link>

      {property.images.length > 0 ? (
        <Gallery images={property.images} alt={property.title} />
      ) : (
        <div className="flex aspect-[16/10] items-center justify-center rounded-xl bg-gradient-to-br from-[#ddd2bd] to-[#c9bca1]">
          <ImageIcon className="size-12 text-[#a99b81]" />
        </div>
      )}

      <div className="mt-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-[#c6d6cd] bg-accent capitalize text-primary">{property.operation}</Badge>
          <Badge variant="secondary" className="capitalize text-muted-foreground">{property.type}</Badge>
          <Badge className={cn('gap-1.5 border-transparent capitalize', statusStyles[property.status] ?? '')}>
            <span className="size-1.5 rounded-full bg-current" />
            {property.status}
          </Badge>
          <span className="ml-auto rounded-md bg-secondary px-2 py-0.5 font-mono text-xs font-semibold tracking-wider text-muted-foreground">
            Cód. {property.code}
          </span>
        </div>

        <h1 className="mt-3 font-serif text-3xl font-semibold text-primary sm:text-4xl">{property.title}</h1>

        <div className="mt-2 flex items-center gap-1.5 text-muted-foreground">
          <MapPinIcon className="size-4 shrink-0" />
          {property.locality ? `${property.locality} · ${property.address}` : property.address}
        </div>

        <div className="mt-4 font-serif text-3xl font-semibold text-primary">
          ${property.price.toLocaleString('es-AR')}
          {property.operation === 'alquiler' && (
            <span className="ml-1 text-base font-semibold text-muted-foreground">/ mes</span>
          )}
        </div>

        {(property.bedrooms != null || property.bathrooms != null || property.area != null) && (
          <div className="mt-5 flex flex-wrap gap-6 border-y border-border py-4 font-semibold">
            {property.bedrooms != null && (
              <span className="flex items-center gap-2"><BedDoubleIcon className="size-5 text-terracotta" /> {property.bedrooms} amb.</span>
            )}
            {property.bathrooms != null && (
              <span className="flex items-center gap-2"><BathIcon className="size-5 text-terracotta" /> {property.bathrooms} baño{property.bathrooms === 1 ? '' : 's'}</span>
            )}
            {property.area != null && (
              <span className="flex items-center gap-2"><RulerIcon className="size-5 text-terracotta" /> {property.area} m²</span>
            )}
          </div>
        )}

        {property.description && (
          <div className="mt-5">
            <h2 className="font-serif text-lg font-semibold">Descripción</h2>
            <p className="mt-1.5 whitespace-pre-line text-muted-foreground">{property.description}</p>
          </div>
        )}

        {canEdit && (
          <Button variant="outline" asChild className="mt-6">
            <Link href={`/dashboard/properties/${property.id}/edit`}><PencilIcon /> Editar</Link>
          </Button>
        )}
      </div>
    </div>
  )
}
