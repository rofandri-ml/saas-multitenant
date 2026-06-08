import { Card } from '@/components/ui/card'
import { SparklesIcon } from 'lucide-react'

// ──────────────────────────────────────────────────────────────────────────────
// Billing (Clerk PricingTable) — DESACTIVADO temporalmente.
// Clerk Billing aún no está cableado en producción, así que el <PricingTable/> se
// ve vacío. Mostramos un placeholder on-brand mientras tanto.
//
// PARA REVERTIR (cuando Stripe/Clerk Billing esté configurado en prod):
//   1) Descomentar el import y el `pricingAppearance` de abajo.
//   2) Reemplazar el placeholder del return por:  <PricingTable appearance={pricingAppearance} />
//   3) Volver a mostrar el link "Planes" en app/(dashboard)/layout.tsx.
//
// import { PricingTable } from '@clerk/nextjs'
//
// const pricingAppearance = {
//   variables: {
//     colorPrimary: '#264e41',
//     colorText: '#2c2823',
//     colorTextSecondary: '#7a6f61',
//     colorBackground: '#f7f2e8',
//     colorInputBackground: '#f7f2e8',
//     borderRadius: '0.75rem',
//   },
// }
// ──────────────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 font-serif text-3xl font-semibold text-primary">Planes</h1>

      <Card className="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-accent text-primary">
          <SparklesIcon className="size-6" />
        </div>
        <div>
          <p className="font-serif text-xl font-semibold text-primary">Planes — próximamente</p>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
            Estamos preparando los planes para publicar más propiedades y acceder a funciones
            premium. Por ahora podés publicar con tu cuenta sin costo. Te avisamos cuando estén
            disponibles.
          </p>
        </div>
      </Card>
    </div>
  )
}
