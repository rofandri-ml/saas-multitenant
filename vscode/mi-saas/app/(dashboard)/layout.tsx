import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
  OrganizationSwitcher,
} from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import { isSuperAdmin } from '@/lib/super-admin'

// Estilo compartido de los links de navegación (paleta cálida del header).
const navLinkClass =
  'rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground'

// Layout del panel de gestión (marca cálida). El acceso lo protege el middleware
// (proxy.ts): /dashboard(.*) requiere sesión.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId, orgId, orgRole } = await auth()
  const isOrgAdmin = orgRole === 'org:admin'
  // Ajustes: el admin de la org, o una cuenta personal (sin org activa).
  const canAccessSettings = isOrgAdmin || !orgId
  const superAdmin = isSuperAdmin(userId)

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-border bg-card/85 backdrop-blur backdrop-saturate-150">
        <div className="mx-auto flex max-w-[1120px] items-center justify-between gap-4 px-6 py-4 md:px-7">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2.5">
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
                <Link href="/dashboard" className={navLinkClass}>Propiedades</Link>
                <Link href="/dashboard/consultas" className={navLinkClass}>Consultas</Link>
                {/* Oculto hasta cablear Clerk Billing/Stripe en prod (la página es un placeholder).
                    Revertir: descomentar este link. */}
                {/* <Link href="/dashboard/pricing" className={navLinkClass}>Planes</Link> */}
                {canAccessSettings && (
                  <Link href="/dashboard/settings" className={navLinkClass}>Ajustes</Link>
                )}
                {superAdmin && (
                  <Link href="/dashboard/admin" className={navLinkClass}>Plataforma</Link>
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
    </>
  )
}
