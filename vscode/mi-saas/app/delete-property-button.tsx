'use client'

import { Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Botón de borrado (ícono) con confirmación. Vive dentro del <form action={deleteProperty}>:
// si el usuario cancela, frena el submit. El servidor sigue siendo la frontera real.
export function DeletePropertyButton({ title }: { title: string }) {
  return (
    <Button
      type="submit"
      variant="outline"
      size="icon"
      aria-label={`Borrar ${title}`}
      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
      onClick={(e) => {
        if (!window.confirm(`¿Seguro que querés borrar "${title}"? Esta acción no se puede deshacer.`)) {
          e.preventDefault()
        }
      }}
    >
      <Trash2Icon />
    </Button>
  )
}
