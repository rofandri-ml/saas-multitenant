import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { esES } from '@clerk/localizations'
import { Fraunces, Hanken_Grotesk } from 'next/font/google'
import './globals.css'

// Títulos: Fraunces. Cuerpo: Hanken Grotesk. Expuestas como variables CSS;
// el ruteo headings→Fraunces / body→Hanken se hace en globals.css.
const fraunces = Fraunces({ variable: '--font-fraunces', subsets: ['latin'], display: 'swap' })
const hankenGrotesk = Hanken_Grotesk({ variable: '--font-hanken', subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: 'Hogar · Portal inmobiliario',
  description: 'Publicá y encontrá propiedades',
}

// Apariencia de los componentes de Clerk, alineada a la paleta del tema.
const clerkAppearance = {
  variables: {
    colorPrimary: '#264e41',
    colorText: '#2c2823',
    colorTextSecondary: '#7a6f61',
    colorBackground: '#f7f2e8',
    colorInputBackground: '#f7f2e8',
    borderRadius: '0.75rem',
  },
}

// Layout raíz: solo el shell común (html/body + fuentes + ClerkProvider).
// Cada route group tiene su propio header: (public) y (dashboard).
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${fraunces.variable} ${hankenGrotesk.variable} antialiased`}>
        {/* `esES` es válido en runtime; el cast salva la divergencia de tipos entre
            @clerk/localizations y la versión de @clerk/types que trae @clerk/nextjs. */}
        <ClerkProvider
          appearance={clerkAppearance}
          localization={esES as unknown as React.ComponentProps<typeof ClerkProvider>['localization']}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  )
}
