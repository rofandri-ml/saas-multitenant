import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ImageUploader } from './image-uploader'
import { SubmitButton } from '@/app/submit-button'
import { LOCALITIES } from '@/lib/localities'

type PropertyValues = {
  id: string
  title: string
  address: string
  locality: string | null
  price: number
  operation: string
  type: string
  description: string | null
  bedrooms: number | null
  bathrooms: number | null
  area: number | null
  images?: string[]
}

// Formulario compartido por publicar (/properties/new) y editar (/properties/[id]/edit).
// `action` es la Server Action correspondiente; `property` precarga los valores al editar.
export function PropertyForm({
  action,
  submitLabel,
  property,
}: {
  action: (formData: FormData) => void | Promise<void>
  submitLabel: string
  property?: PropertyValues
}) {
  return (
    <form action={action} className="space-y-5 rounded-xl bg-card p-6 ring-1 ring-foreground/10">
      {property && <input type="hidden" name="id" value={property.id} />}

      <div className="space-y-1.5">
        <Label htmlFor="title">Título <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input id="title" name="title" required defaultValue={property?.title} placeholder="Ej. Casa con jardín en Palermo" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="address">Dirección <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input id="address" name="address" required defaultValue={property?.address} placeholder="Ej. Av. Santa Fe 3400, CABA" />
      </div>

      <div className="space-y-1.5">
        <Label>Localidad / zona</Label>
        <Select name="locality" defaultValue={property?.locality ?? undefined}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Elegí una localidad" /></SelectTrigger>
          <SelectContent>
            {LOCALITIES.map((l) => (
              <SelectItem key={l} value={l}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="price">Precio <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input id="price" name="price" type="number" min={0} step={1} required defaultValue={property?.price} placeholder="185000" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Operación</Label>
          <Select name="operation" defaultValue={property?.operation ?? 'venta'}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="venta">Venta</SelectItem>
              <SelectItem value="alquiler">Alquiler</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Tipo</Label>
          <Select name="type" defaultValue={property?.type ?? 'casa'}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="casa">Casa</SelectItem>
              <SelectItem value="departamento">Departamento</SelectItem>
              <SelectItem value="terreno">Terreno</SelectItem>
              <SelectItem value="local">Local</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="bedrooms">Ambientes</Label>
          <Input id="bedrooms" name="bedrooms" type="number" min={0} defaultValue={property?.bedrooms ?? ''} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bathrooms">Baños</Label>
          <Input id="bathrooms" name="bathrooms" type="number" min={0} defaultValue={property?.bathrooms ?? ''} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="area">Superficie (m²)</Label>
          <Input id="area" name="area" type="number" min={0} defaultValue={property?.area ?? ''} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Descripción</Label>
        <Textarea id="description" name="description" rows={3} defaultValue={property?.description ?? ''} placeholder="Detalles, comodidades, etc." />
      </div>

      <ImageUploader initialImages={property?.images ?? []} />

      <div className="flex gap-3">
        <SubmitButton>{submitLabel}</SubmitButton>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Cancelar</Link>
        </Button>
      </div>
    </form>
  )
}
