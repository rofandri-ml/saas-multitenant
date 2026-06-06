import { PricingTable } from '@clerk/nextjs'

// Appearance para que el PricingTable de Clerk combine con la paleta cálida del tema
// (verde pino como primario, fondo pergamino, bordes redondeados).
const pricingAppearance = {
  variables: {
    colorPrimary: '#264e41',
    colorText: '#2c2823',
    colorTextSecondary: '#7a6f61',
    colorBackground: '#f7f2e8',
    colorInputBackground: '#f7f2e8',
    borderRadius: '0.75rem',
  },
}

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 font-serif text-3xl font-semibold text-primary">Planes</h1>
      <PricingTable appearance={pricingAppearance} />
    </div>
  )
}
