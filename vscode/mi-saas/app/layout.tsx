import type { Metadata } from 'next'
import {
  ClerkProvider,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
  OrganizationSwitcher,
} from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import { esES } from '@clerk/localizations'
import { Fraunces, Hanken_Grotesk } from 'next/font/google'
import Link from 'next/link'
import './globals.css'

// Títulos: Fraunces. Cuerpo: Hanken Grotesk. Expuestas como variables CSS;
// el ruteo headings→Fraunces / body→Hanken se hace en globals.css.
const fraunces = Fraunces({ variable: '--font-fraunces', subsets: ['latin'], display: 'swap' })
const hankenGrotesk = Hanken_Grotesk({ variable: '--font-hanken', subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: 'Mi SaaS',
  description: 'Plantilla SaaS multi-tenant',
}

// Apariencia de los componentes de Clerk, alineada a la paleta del tema
// (tonos cálidos + bordes redondeados).
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

// Estilo compartido de los links de navegación (paleta cálida del header).
const navLinkClass =
  'rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground'

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Solo para decidir qué links mostrar (presentación). No cambia la lógica de auth.
  const { userId, orgRole } = await auth()
  const isOrgAdmin = orgRole === 'org:admin'
  const superAdminIds = (process.env.SUPER_ADMIN_IDS ?? '').split(',').map((id) => id.trim())
  const isSuperAdmin = userId != null && superAdminIds.includes(userId)

  return (
    <html lang="es">
      <body className={`${fraunces.variable} ${hankenGrotesk.variable} antialiased`}>
        {/* `esES` es válido en runtime; el cast salva la divergencia de tipos entre
            @clerk/localizations y la versión de @clerk/types que trae @clerk/nextjs. */}
        <ClerkProvider
          appearance={clerkAppearance}
          localization={esES as unknown as React.ComponentProps<typeof ClerkProvider>['localization']}
        >
          <header className="sticky top-0 z-10 border-b border-border bg-card/85 backdrop-blur backdrop-saturate-150">
            <div className="mx-auto flex max-w-[1120px] items-center justify-between gap-4 px-6 py-4 md:px-7">
              <div className="flex items-center gap-6">
                <Link href="/" className="flex items-center gap-2.5">
                  <span className="flex size-9 items-center justify-center rounded-[10px] bg-primary text-primary-foreground">
                    <svg
                      className="size-5"
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
                  </span>
                  <span className="font-serif text-xl font-semibold text-primary">Hogar</span>
                </Link>
                {userId && (
                  <nav className="hidden items-center gap-1 md:flex">
                    <Link href="/" className={navLinkClass}>Propiedades</Link>
                    <Link href="/pricing" className={navLinkClass}>Planes</Link>
                    {isOrgAdmin && (
                      <Link href="/settings" className={navLinkClass}>Ajustes</Link>
                    )}
                    {isSuperAdmin && (
                      <Link href="/admin" className={navLinkClass}>Plataforma</Link>
                    )}
                  </nav>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Show when="signed-out">
                  <SignInButton>
                    <button className="cursor-pointer rounded-full px-4 py-2 text-sm font-semibold text-foreground hover:bg-secondary">
                      Iniciar sesión
                    </button>
                  </SignInButton>
                  <SignUpButton>
                    <button className="cursor-pointer rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                      Registrarse
                    </button>
                  </SignUpButton>
                </Show>
                <Show when="signed-in">
                  <OrganizationSwitcher />
                  <UserButton />
                </Show>
              </div>
            </div>
          </header>
          <main className="mx-auto w-full max-w-[1120px] px-6 py-10 pb-16 md:px-7">
            {children}
          </main>
        </ClerkProvider>
      </body>
    </html>
  )
}
