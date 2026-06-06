'use client'

import { useActionState } from 'react'
import { CheckCircle2Icon, AlertCircleIcon } from 'lucide-react'
import { createLead, type LeadFormState } from './actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SubmitButton } from '@/app/submit-button'

const initialState: LeadFormState = { status: 'idle' }

// Formulario de consulta de la ficha pública. Usa useActionState para mostrar
// validación/errores y un estado de éxito sin redireccionar.
export function LeadForm({ propertyId }: { propertyId: string }) {
  const [state, formAction] = useActionState(createLead, initialState)

  if (state.status === 'success') {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-[#c6d6cd] bg-accent p-5 text-primary">
        <CheckCircle2Icon className="mt-0.5 size-5 shrink-0" />
        <div>
          <p className="font-semibold">¡Consulta enviada!</p>
          <p className="mt-1 text-sm text-primary/80">
            El anunciante recibió tu mensaje y se va a poner en contacto.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-4 rounded-xl bg-card p-6 ring-1 ring-foreground/10">
      <input type="hidden" name="propertyId" value={propertyId} />

      <div className="space-y-1.5">
        <Label htmlFor="name">Nombre <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input id="name" name="name" required maxLength={120} placeholder="Tu nombre" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email <span className="text-destructive" aria-hidden="true">*</span></Label>
          <Input id="email" name="email" type="email" required maxLength={200} placeholder="tu@email.com" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" name="phone" type="tel" maxLength={40} placeholder="Opcional" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="message">Mensaje <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Textarea
          id="message"
          name="message"
          required
          maxLength={1000}
          rows={4}
          placeholder="Hola, me interesa esta propiedad. ¿Podemos coordinar una visita?"
        />
      </div>

      {state.status === 'error' && state.error && (
        <p className="flex items-center gap-1.5 text-sm text-destructive">
          <AlertCircleIcon className="size-4 shrink-0" />
          {state.error}
        </p>
      )}

      <SubmitButton pendingLabel="Enviando…">Enviar consulta</SubmitButton>
    </form>
  )
}
