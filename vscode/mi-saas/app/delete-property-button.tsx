'use client'

// Botón de borrado con confirmación. Vive dentro del <form action={deleteProperty}>
// del Server Component: si el usuario cancela, frena el submit; si confirma, deja
// que el form se envíe normalmente. El servidor sigue siendo la frontera real.
export function DeletePropertyButton({ title, className }: { title: string; className?: string }) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(`¿Seguro que querés borrar "${title}"? Esta acción no se puede deshacer.`)) {
          e.preventDefault()
        }
      }}
    >
      Borrar
    </button>
  )
}
