import Link from 'next/link'
import Image from 'next/image'
import prisma from '@/lib/prisma'
import { Prisma } from '@/app/generated/prisma/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SearchXIcon, MapPinIcon, BedDoubleIcon, BathIcon, RulerIcon, ImageIcon } from 'lucide-react'
import { PropertyFilters } from './property-filters'

const ANY = 'any'

// searchParams llegan como string | string[] | undefined: tomamos el primer valor.
function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

// Entero positivo del search param, o null si está vacío/inválido.
function positiveInt(value: string | string[] | undefined): number | null {
  const s = first(value)?.trim()
  if (!s) return null
  const n = Number(s)
  return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : null
}

type PublicSearchParams = {
  code?: string | string[]
  locality?: string | string[]
  operation?: string | string[]
  type?: string | string[]
  min?: string | string[]
  max?: string | string[]
  bedrooms?: string | string[]
}

export default async function PublicHome({
  searchParams,
}: {
  searchParams: Promise<PublicSearchParams>
}) {
  const sp = await searchParams

  // Listado público: SIEMPRE status 'activa' y cross-tenant A PROPÓSITO (es el
  // marketplace: no se filtra por org/owner). Encima combinamos los filtros de la URL.
  const where: Prisma.PropertyWhereInput = { status: 'activa' }

  const code = first(sp.code)?.trim()
  if (code) where.code = code.toUpperCase() // código público: match exacto

  const locality = first(sp.locality)?.trim()
  if (locality) where.locality = locality

  const operation = first(sp.operation)?.trim()
  if (operation === 'venta' || operation === 'alquiler') where.operation = operation

  const type = first(sp.type)?.trim()
  if (type) where.type = type

  const min = positiveInt(sp.min)
  const max = positiveInt(sp.max)
  if (min != null || max != null) {
    where.price = { ...(min != null && { gte: min }), ...(max != null && { lte: max }) }
  }

  const bedrooms = positiveInt(sp.bedrooms)
  if (bedrooms != null) where.bedrooms = { gte: bedrooms }

  const properties = await prisma.property.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })

  const initialFilters = {
    code: code ?? '',
    locality: locality ?? ANY,
    operation: operation ?? ANY,
    type: type ?? ANY,
    min: min != null ? String(min) : '',
    max: max != null ? String(max) : '',
    bedrooms: bedrooms != null ? String(bedrooms) : ANY,
  }

  return (
    <>
      <div className="mb-8">
        <div className="text-[13px] font-bold uppercase tracking-[0.08em] text-terracotta">Propiedades</div>
        <h1 className="mt-1 font-serif text-4xl font-semibold text-primary">Encontrá tu próximo hogar</h1>
        <p className="mt-1 text-muted-foreground">
          {properties.length} {properties.length === 1 ? 'propiedad encontrada' : 'propiedades encontradas'}.
        </p>
      </div>

      <PropertyFilters initial={initialFilters} />

      {properties.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <SearchXIcon className="size-6" />
          </div>
          <div>
            <p className="font-serif text-lg font-semibold text-foreground">Sin resultados</p>
            <p className="mt-1 text-sm text-muted-foreground">
              No hay propiedades que coincidan con tu búsqueda. Probá ajustar o limpiar los filtros.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-6">
          {properties.map((p) => (
            <Link key={p.id} href={`/propiedades/${p.code}`} className="block h-full">
              <Card className="h-full gap-0 py-0 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
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
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
