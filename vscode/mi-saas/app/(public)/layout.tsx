import Link from 'next/link'
import { SearchIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

// Layout del sitio público: header con logo, buscador (placeholder) y accesos al
// panel. No requiere sesión.
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-card/85 backdrop-blur backdrop-saturate-150">
        <div className="mx-auto flex max-w-[1120px] items-center gap-4 px-6 py-4 md:px-7">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
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

          {/* Buscador: placeholder por ahora (todavía no filtra). */}
          <div className="relative mx-2 hidden flex-1 sm:block">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por zona, tipo…"
              aria-label="Buscar propiedades"
              className="w-full pl-9"
            />
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/dashboard/properties/new">Publicar</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard">Ingresar</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1120px] flex-1 px-6 py-10 pb-16 md:px-7">
        {children}
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-[1120px] px-6 py-8 text-sm text-muted-foreground md:px-7">
          © 2026 Hogar · Portal inmobiliario
        </div>
      </footer>
    </div>
  )
}
