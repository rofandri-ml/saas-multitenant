'use client'

import type { ComponentProps } from 'react'
import { useFormStatus } from 'react-dom'
import { Loader2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Botón de submit con estado de carga: mientras la Server Action del form corre,
// se deshabilita y muestra "Guardando…" (vía useFormStatus). Debe ir dentro de un <form>.
export function SubmitButton({
  children,
  pendingLabel = 'Guardando…',
  ...props
}: ComponentProps<typeof Button> & { pendingLabel?: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" {...props} disabled={pending} aria-busy={pending}>
      {pending && <Loader2Icon className="animate-spin" />}
      {pending ? pendingLabel : children}
    </Button>
  )
}
