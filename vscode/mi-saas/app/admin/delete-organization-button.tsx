'use client'

import { Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Botón de borrado de organización con confirmación. Vive dentro del
// <form action={deleteOrganization}>: si el usuario cancela, frena el submit.
// El servidor (chequeo de SUPER_ADMIN_IDS) sigue siendo la frontera real.
export function DeleteOrganizationButton({ name }: { name: string }) {
  return (
    <Button
      type="submit"
      variant="outline"
      size="sm"
      className="border-slate-600 bg-transparent text-red-300 hover:border-red-800 hover:bg-red-950/40 hover:text-red-200"
      onClick={(e) => {
        if (
          !window.confirm(
            `¿Eliminar la inmobiliaria "${name}"? Se borrarán también TODAS sus propiedades. Esta acción no se puede deshacer.`,
          )
        ) {
          e.preventDefault()
        }
      }}
    >
      <Trash2Icon /> Eliminar
    </Button>
  )
}
