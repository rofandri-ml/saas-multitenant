import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// El panel de gestión requiere sesión; el resto (sitio público) es accesible sin login.
const isDashboardRoute = createRouteMatcher(['/dashboard(.*)'])
// Rutas que NUNCA pasan por el gate del modo privado: la página de acceso, las APIs
// (tienen su propia auth) y las rutas internas de Clerk. Los assets ya los excluye el matcher.
const isExcludedFromGate = createRouteMatcher(['/acceso', '/api(.*)', '/trpc(.*)', '/__clerk(.*)'])

export default clerkMiddleware(async (auth, req) => {
  // El panel sigue igual: siempre requiere sesión.
  if (isDashboardRoute(req)) {
    await auth.protect()
    return
  }

  // Modo privado reversible: con PRIVATE_MODE=true el sitio público queda detrás de un
  // gate; con cualquier otro valor (o sin setear), comportamiento normal (público abierto).
  if (process.env.PRIVATE_MODE === 'true' && !isExcludedFromGate(req)) {
    const { userId } = await auth()
    const expected = process.env.SITE_ACCESS_PASSWORD
    const hasAccess = !!expected && req.cookies.get('site_access')?.value === expected
    // Sin sesión de Clerk y sin cookie de acceso válida → a la página de acceso.
    if (!userId && !hasAccess) {
      return NextResponse.redirect(new URL('/acceso', req.url))
    }
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
}
