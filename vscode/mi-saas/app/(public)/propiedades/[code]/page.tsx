import Link from 'next/link'
import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { Gallery } from '@/components/gallery'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeftIcon,
  MapPinIcon,
  BedDoubleIcon,
  BathIcon,
  RulerIcon,
  ImageIcon,
} from 'lucide-react'
import { LeadForm } from './lead-form'

export default async function PublicPropertyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params

  // Ficha pública: se busca por código y solo si está activa. Cross-tenant a
  // propósito (cualquier publicador). Si no existe o no está activa → 404.
  const property = await prisma.property.findFirst({
    where: { code: code.toUpperCase(), status: 'activa' },
  })

  if (!property) notFound()

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/"
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

        <div className="mt-8">
          <h2 className="mb-3 font-serif text-xl font-semibold text-primary">Consultar por esta propiedad</h2>
          <LeadForm propertyId={property.id} />
        </div>
      </div>
    </div>
  )
}
