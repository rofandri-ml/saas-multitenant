# CLAUDE.md

Guía del proyecto para Claude Code. Leé esto antes de tocar el código.

## Qué estamos construyendo

Plantilla SaaS multi-tenant con white-labeling: una sola plataforma donde se dan de alta organizaciones (tenants), cada una con su espacio aislado y personalizable. Pensada para adaptarse a distintos rubros, no a uno solo.

Tres niveles de acceso:

- **Super Admin** (dueño de la plataforma): ve y gestiona todas las organizaciones, planes y métricas.
- **Admin del tenant** (cliente): gestiona sus usuarios, su branding y sus ajustes.
- **Usuario final**: usa la app dentro de su organización.

## Stack (no cambiar sin acordarlo)

- **Framework**: Next.js (App Router) + TypeScript en modo estricto
- **Auth + multi-tenancy**: Clerk (Organizations = tenants, roles, invitaciones)
- **Base de datos**: PostgreSQL (Neon) con Prisma como ORM
- **Pagos**: Stripe (planes, suscripciones, webhooks)
- **UI**: Tailwind CSS + shadcn/ui
- **Email**: Resend
- **Deploy**: Vercel

## Principios de arquitectura

- **Serverless**: el backend son Route Handlers y Server Actions de Next.js. No hay servidor que mantener.
- **Núcleo genérico + verticales enchufables**: el núcleo (auth, organizaciones, roles, billing, ajustes, branding, panel de super admin) es reutilizable y no se acopla a ningún rubro. Lo específico de cada negocio va en módulos aparte.
- **Aislamiento por tenant**: TODA consulta a la base filtra por `organizationId`. Nunca devolver datos sin ese filtro.

## Estructura

- `app/` — rutas, páginas y Route Handlers
- `app/api/` — endpoints (incluido el webhook de Stripe)
- `components/` — componentes de UI (shadcn en `components/ui/`)
- `lib/` — lógica, helpers y clientes (db, stripe, etc.)
- `prisma/` — `schema.prisma` y migraciones

## Comandos

```bash
pnpm dev                  # levantar en local (localhost:3000)
pnpm build                # build de producción
pnpm lint                 # ESLint
pnpm typecheck            # chequeo de tipos (tsc --noEmit)
npx prisma migrate dev    # crear/aplicar migración en local
npx prisma studio         # visor de la base
stripe listen --forward-to localhost:3000/api/webhooks/stripe   # webhooks en local
```

## Convenciones

- TypeScript estricto: nada de `any`, tipar todo.
- Componentes de servidor por defecto; `"use client"` solo cuando hace falta (estado, eventos, hooks del navegador).
- Usar componentes de shadcn/ui; no reinventar botones, inputs, etc.
- Nombres en inglés para el código (variables, funciones, tablas); textos de UI en español.
- Cambios chicos y verificables: una cosa a la vez, probada en local antes de commitear.

## Reglas críticas (no negociables)

- **Secretos solo en variables de entorno.** Nunca hardcodear claves en el código. Nunca commitear `.env*` (debe estar en `.gitignore`).
- **Claves de test en local, claves live solo en Vercel (producción).** No mezclar.
- **Toda query filtra por `organizationId`.** Es la frontera entre clientes; sin eso se filtran datos de un tenant a otro.
- **`NEXT_PUBLIC_` solo para valores que pueden ser públicos.** Todo lo demás se queda en el servidor.
- **Validar la firma del webhook de Stripe** antes de procesar cualquier evento.
- No correr migraciones contra la base de producción sin avisar.
- No borrar datos ni archivos de forma permanente sin confirmación explícita.

## Flujo de trabajo

- `main` = estable / producción. Trabajar en ramas de feature.
- Commit cuando algo funciona; push a GitHub. Cada push genera un Preview en Vercel; el merge a `main` publica a producción.

## Cuando tengas dudas

Pará y preguntá antes de: tocar producción, cambiar el stack, modificar el modelo de datos de forma que rompa migraciones, o cualquier acción irreversible. Mejor un paso de más que un cambio difícil de revertir.

## Tooling (MCP) que usamos

- **GitHub** — versionado, ramas, PRs
- **Figma** — leer diseños y generar los componentes que matchean
- **Stripe / Neon** — gestionar pagos y base de datos desde el editor
- **Postman** — probar los endpoints
- Planificación: un tablero (Notion o Jira) con el roadmap por fases

#################################################################################################################################################################################################################################################################################################################


### ACTUALIZACION 3/6/2026

# CLAUDE.md

Guía del proyecto para Claude Code. Leé esto antes de tocar el código.

## Qué estamos construyendo

Plantilla SaaS multi-tenant con white-labeling: una plataforma donde se dan de alta organizaciones (tenants), cada una con su espacio aislado y personalizable. Pensada para adaptarse a distintos rubros.

Tres niveles de acceso:

- **Super Admin** (dueño de la plataforma): ve y gestiona todas las organizaciones. Se identifica por la variable `SUPER_ADMIN_IDS` (IDs de usuario de Clerk, separados por coma), chequeada en el servidor. Su panel está en `/admin`.
- **Admin del tenant** (rol `org:admin` de Clerk): gestiona su organización, su branding y sus ajustes (`/settings`).
- **Usuario final** (rol `org:member`): usa la app dentro de su organización.

## Stack

- **Framework**: Next.js 16 (App Router) + TypeScript estricto. **Sin carpeta `src/`**: el código vive en `app/`.
- **Auth + multi-tenancy + billing**: Clerk. Las Organizations = tenants. Billing con Clerk Billing (usa Stripe por debajo), planes "for Organizations".
- **Base de datos**: PostgreSQL en Neon, con Prisma v7.
- **UI**: Tailwind CSS v4 (sin archivo de config; se configura desde el CSS).
- **Deploy**: Vercel.
- **Entorno local**: Windows nativo, terminal PowerShell, Node 22, pnpm.

## Detalles del stack que importan (gotchas)

- **Middleware**: en Next.js 16 el archivo se llama `proxy.ts` (NO `middleware.ts`), en la raíz. Usa `clerkMiddleware()`.
- **Prisma v7**: el cliente se genera en `app/generated/prisma` (generator `prisma-client`). Importar SIEMPRE desde `'../app/generated/prisma/client'` (con `/client` al final). La conexión usa el adapter `@prisma/adapter-pg`. La `DATABASE_URL` se configura en `prisma.config.ts` (que lee `.env` vía dotenv), NO en el bloque `datasource` del schema.
- **Cliente de DB**: usar siempre el singleton de `lib/prisma.ts`. No crear instancias nuevas de PrismaClient.
- **Entorno**: todas las variables en un único `.env` en la raíz (claves de Clerk + `DATABASE_URL`). El `.env.example` solo tiene placeholders.

## Estructura

- `app/` — rutas y páginas (App Router)
- `app/admin/` — panel de Super Admin (vista de todos los tenants)
- `app/settings/` — personalización del tenant (white-label, solo admin)
- `app/pricing/` — tabla de planes (`<PricingTable />` de Clerk)
- `app/actions.ts`, `app/settings/actions.ts` — Server Actions
- `lib/prisma.ts` — cliente de Prisma (singleton)
- `prisma/` — `schema.prisma` y migraciones
- `app/generated/prisma/` — cliente generado (NO versionar)

## Comandos

```bash
pnpm dev                          # local en http://localhost:3000
npx prisma migrate dev --name x   # crear/aplicar una migración
npx prisma studio                 # visor de la base
npx prisma generate               # regenerar el cliente tras cambiar el schema
```

## Reglas críticas (no negociables)

- **Aislamiento por tenant**: TODA consulta a la base filtra por `organizationId`, tomado de `auth()` (el `orgId` de Clerk). Nunca devolver ni escribir datos sin ese filtro.
- **Secretos solo en `.env`** (nunca en el código, nunca pegados en un chat). El `.env` está en `.gitignore`.
- **Roles del lado del servidor**: las acciones sensibles chequean `orgRole === 'org:admin'` en el servidor (Server Action / Route Handler). El panel `/admin` chequea `SUPER_ADMIN_IDS`. Nunca confiar solo en la UI.

## White-label

El branding por organización (lema, color de acento) se guarda en el `publicMetadata` de la organización en Clerk, vía `updateOrganizationMetadata(orgId, { publicMetadata })` (solo admin lo escribe). Se lee desde `organization.publicMetadata`.

## Billing

Clerk Billing. Los planes "for Organizations" se definen en el dashboard de Clerk. Página de precios con `<PricingTable />`. Para gatear features según el plan, usar `has({ plan })` o `has({ feature })` del lado del servidor.

## Cuando tengas dudas

Pará y preguntá antes de: tocar producción, cambiar el stack, modificar el modelo de datos de forma que rompa migraciones, o cualquier acción irreversible. Cambios chicos y verificables, probados en local antes de avanzar.

## Tooling (MCP)

GitHub para versionado. Más adelante: Figma (diseños), Postman (probar endpoints), Notion o Jira (roadmap por fases).