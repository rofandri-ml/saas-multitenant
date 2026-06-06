'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SearchIcon, XIcon } from 'lucide-react'
import { LOCALITIES } from '@/lib/localities'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Valor centinela para "sin filtro" en los Select (Radix no admite value="").
const ANY = 'any'

export type FilterValues = {
  code: string
  locality: string
  operation: string
  type: string
  min: string
  max: string
  bedrooms: string
}

// Filtros del listado público. Construye los search params (omitiendo vacíos) y
// navega a `/?...`, de modo que la URL queda compartible y la página (server
// component) la lee para armar el where de Prisma.
export function PropertyFilters({ initial }: { initial: FilterValues }) {
  const router = useRouter()
  const [values, setValues] = useState<FilterValues>(initial)

  function set<K extends keyof FilterValues>(key: K, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (values.code.trim()) params.set('code', values.code.trim())
    if (values.locality !== ANY) params.set('locality', values.locality)
    if (values.operation !== ANY) params.set('operation', values.operation)
    if (values.type !== ANY) params.set('type', values.type)
    if (values.min.trim()) params.set('min', values.min.trim())
    if (values.max.trim()) params.set('max', values.max.trim())
    if (values.bedrooms !== ANY) params.set('bedrooms', values.bedrooms)
    const qs = params.toString()
    router.push(qs ? `/?${qs}` : '/')
  }

  function onClear() {
    setValues({ code: '', locality: ANY, operation: ANY, type: ANY, min: '', max: '', bedrooms: ANY })
    router.push('/')
  }

  const hasFilters =
    values.code.trim() !== '' ||
    values.locality !== ANY ||
    values.operation !== ANY ||
    values.type !== ANY ||
    values.min.trim() !== '' ||
    values.max.trim() !== '' ||
    values.bedrooms !== ANY

  return (
    <form
      onSubmit={onSubmit}
      className="mb-8 rounded-xl bg-card p-5 ring-1 ring-foreground/10"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="code">Código</Label>
          <Input
            id="code"
            value={values.code}
            onChange={(e) => set('code', e.target.value.toUpperCase())}
            placeholder="Ej. PEYBHB"
            className="font-mono uppercase"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Localidad / zona</Label>
          <Select value={values.locality} onValueChange={(v) => set('locality', v)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Todas</SelectItem>
              {LOCALITIES.map((l) => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Operación</Label>
          <Select value={values.operation} onValueChange={(v) => set('operation', v)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Todas</SelectItem>
              <SelectItem value="venta">Venta</SelectItem>
              <SelectItem value="alquiler">Alquiler</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Tipo</Label>
          <Select value={values.type} onValueChange={(v) => set('type', v)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Todos</SelectItem>
              <SelectItem value="casa">Casa</SelectItem>
              <SelectItem value="departamento">Departamento</SelectItem>
              <SelectItem value="terreno">Terreno</SelectItem>
              <SelectItem value="local">Local</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Precio</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              inputMode="numeric"
              value={values.min}
              onChange={(e) => set('min', e.target.value)}
              placeholder="Mín."
              aria-label="Precio mínimo"
            />
            <span className="text-muted-foreground">–</span>
            <Input
              type="number"
              min={0}
              inputMode="numeric"
              value={values.max}
              onChange={(e) => set('max', e.target.value)}
              placeholder="Máx."
              aria-label="Precio máximo"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Ambientes (mín.)</Label>
          <Select value={values.bedrooms} onValueChange={(v) => set('bedrooms', v)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Cualquiera</SelectItem>
              <SelectItem value="1">1 o más</SelectItem>
              <SelectItem value="2">2 o más</SelectItem>
              <SelectItem value="3">3 o más</SelectItem>
              <SelectItem value="4">4 o más</SelectItem>
              <SelectItem value="5">5 o más</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <Button type="submit">
          <SearchIcon /> Buscar
        </Button>
        {hasFilters && (
          <Button type="button" variant="ghost" onClick={onClear}>
            <XIcon /> Limpiar
          </Button>
        )}
      </div>
    </form>
  )
}
