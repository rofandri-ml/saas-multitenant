import { Card } from '@/components/ui/card'
import { AccessForm } from './access-form'

// Página del gate de modo privado (pre-lanzamiento). Fuera de los route groups:
// usa el layout raíz (sin el header del sitio público).
export default function AccesoPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-[12px] bg-primary text-primary-foreground">
            <svg
              className="size-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 11l9-8 9 8" />
              <path d="M5 9.5V20h14V9.5" />
              <path d="M10 20v-6h4v6" />
            </svg>
          </div>
          <h1 className="font-serif text-2xl font-semibold text-primary">Sitio en preparación</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Estamos por lanzar. Ingresá la contraseña de acceso para previsualizar.
          </p>
        </div>
        <Card className="p-6">
          <AccessForm />
        </Card>
      </div>
    </main>
  )
}
