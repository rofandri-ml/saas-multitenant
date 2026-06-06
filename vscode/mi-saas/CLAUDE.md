# CLAUDE.md

Guía del proyecto para Claude Code. Leé esto antes de tocar el código.

## Qué estamos construyendo

Un SaaS **inmobiliario** para publicar y gestionar propiedades, construido sobre un **núcleo multi-tenant genérico y reutilizable**. El núcleo (auth, organizaciones, roles, billing, white-label, panel de plataforma) no se mezcla con lo inmobiliario: lo inmobiliario es la **capa de dominio** que se enchufa encima, de modo que el mismo núcleo podría servir a otro rubro más adelante.

Hay **dos tipos de publicador**, y conviven en la misma app:

- **Propietario directo**: una persona con su cuenta personal de Clerk (sin organización). Publica y gestiona sus propias propiedades.
- **Inmobiliaria**: una organización de Clerk (el tenant). Sus agentes publican propiedades bajo la agencia.

(Por eso las cuentas personales están habilitadas en Clerk: "membership required" está **desactivado**.)

## Niveles de acceso

- **Super Admin** (dueño de la plataforma): ve y gestiona todas las organizaciones. Se identifica por `SUPER_ADMIN_IDS` (IDs de usuario de Clerk separados por coma), chequeado en el servidor. Panel en `/admin`.
- **Admin de la inmobiliaria** (rol `org:admin`): gestiona su organización, su branding y sus ajustes (`/settings`).
- **Agente** (rol `org:member`): publica y gestiona propiedades dentro de su inmobiliaria.
- **Propietario directo** (cuenta personal, sin organización): publica y gestiona sus propias propiedades.

## Stack

- **Framework**: Next.js 16 (App Router) + TypeScript estricto. **Sin carpeta `src/`**: el código vive en `app/`.
- **Auth + multi-tenancy + billing**: Clerk. Organizations = inmobiliarias. Billing con Clerk Billing (Stripe por debajo), planes "for Organizations". UI de Clerk **localizada al español** (`@clerk/localizations` → `esES` en `<ClerkProvider>`).
- **Base de datos**: PostgreSQL en Neon, con Prisma v7.
- **UI**: Tailwind CSS v4 (config desde el CSS) + **shadcn/ui** (componentes en `components/ui/`, sobre `radix-ui`) + **lucide-react** (íconos). Fuentes con `next/font/google`: **Fraunces** (títulos) y **Hanken Grotesk** (cuerpo).
- **Deploy**: Vercel.
- **Entorno local**: Windows nativo, terminal PowerShell, Node 22, **pnpm 10**.

## Detalles del stack que importan (gotchas)

- **Middleware**: en Next.js 16 el archivo se llama `proxy.ts` (NO `middleware.ts`), en la raíz. Usa `clerkMiddleware()`.
- **Prisma v7**: el cliente se genera en `app/generated/prisma` (generator `prisma-client`). Importar SIEMPRE desde `'../app/generated/prisma/client'` (con `/client`). La conexión usa `@prisma/adapter-pg`. La `DATABASE_URL` va en `prisma.config.ts` (lee `.env` vía dotenv), NO en el `datasource` del schema.
- **Cliente de DB**: usar siempre el singleton de `lib/prisma.ts`.
- **Cambios de schema (importante, en Windows)**: editar el schema NO actualiza nada por sí solo. Tras un cambio: **frená el dev server** (mantiene abiertos los archivos del cliente generado y bloquea la regeneración), corré el comando, y volvé a arrancar.
  - `npx prisma migrate dev --name x` → crea/cambia la tabla en Neon **y** regenera el cliente.
  - `npx prisma generate` → solo regenera el cliente (cuando la tabla ya existe pero el cliente quedó viejo).
- **Entorno**: todas las variables en un único `.env` en la raíz. El `.env.example` solo tiene placeholders.
- **pnpm 10 (importante)**: el `node_modules` está linkeado al store **v10**. NO uses `npx pnpm`/`npx shadcn@latest` "pelados" (traen pnpm 11 → `ERR_PNPM_UNEXPECTED_STORE`). Para agregar deps: `pnpm add ...` (tu pnpm local es v10) o `npx pnpm@10 add ...`. El tooling (tsc/eslint/prisma) se corre con `npx` (ej. `npx tsc --noEmit`, `npx eslint .`).
- **shadcn**: `components.json` ya está. Agregar componentes con `npx shadcn@latest add <c>` (crea archivos en `components/ui/`; deps + `lib/utils.ts` con `cn` ya instalados).

## Estructura

- `app/page.tsx` — home: portafolio de propiedades (grilla de tarjetas shadcn)
- `app/properties/new/` — publicar propiedad · `app/properties/[id]/edit/` — editar
- `app/properties/property-form.tsx` — **form compartido** (publicar/editar)
- `app/admin/` — back-office de Super Admin (oscuro/neutro); `app/admin/actions.ts` (`deleteOrganization`)
- `app/settings/` — white-label del tenant (solo admin)
- `app/pricing/` — tabla de planes (`<PricingTable />` de Clerk)
- `app/actions.ts` — Server Actions de Property (create/update/delete/close/reopen)
- `app/settings/actions.ts` — `updateBranding`
- `app/*-button.tsx`, `app/admin/*-button.tsx` — componentes cliente para confirmar borrados
- `app/layout.tsx` — shell: header (marca + nav) + `<ClerkProvider>` + contenedor
- `app/globals.css` — Tailwind v4 + tokens del tema (paleta cálida)
- `components/ui/` — componentes shadcn (no editar a mano salvo necesidad)
- `lib/prisma.ts` (singleton) · `lib/property-scope.ts` (`ownedOrAdminScope`) · `lib/plan.ts` (`FREE_LIMIT`) · `lib/utils.ts` (`cn`)
- `prisma/` — `schema.prisma` y migraciones · `app/generated/prisma/` — cliente generado (NO versionar)
- `desing/mockup-propiedades.html` — **mockup de referencia** del diseño (paleta + tipografías)

## Comandos

```bash
pnpm dev                          # local en http://localhost:3000
npx prisma migrate dev --name x   # crear/aplicar migración (con el dev server frenado)
npx prisma generate               # regenerar el cliente (con el dev server frenado)
npx prisma studio                 # visor de la base
```

## Reglas críticas (no negociables)

- **Aislamiento por contexto**: TODA consulta o mutación se filtra según el contexto activo de `auth()`:
  - Con organización activa (`orgId`): scope `{ organizationId: orgId }`.
  - Cuenta personal (sin `orgId`): scope `{ ownerId: userId, organizationId: null }`.
  Nunca leer ni escribir (incluido borrar/actualizar) por `id` solo: el `where` SIEMPRE lleva además el scope, para que un tenant no pueda tocar datos de otro.
- **Secretos solo en `.env`** (nunca en el código, nunca en un chat). El `.env` está en `.gitignore`.
- **Permisos del lado del servidor**: las acciones sensibles chequean el rol (`org:admin`) en el servidor. El panel `/admin` chequea `SUPER_ADMIN_IDS`. Nunca confiar solo en la UI.

## Dominio inmobiliario

La entidad central es **`Property`** (la propiedad / aviso). Campos clave: `title`, `address`, `price`, `operation` ("venta" | "alquiler"), `type` ("casa" | "departamento" | "terreno" | "local"), `status` ("activa" | "vendida" | "alquilada"), y los de detalle (ambientes, baños, superficie, etc.). Siempre lleva:

- `ownerId`: el usuario que la publicó (propietario o agente).
- `organizationId` (opcional): `null` = propietario directo; con valor = inmobiliaria.

Al crear: `ownerId = userId`, `organizationId = orgId ?? null`. Al listar / editar / borrar: aplicar el scope del contexto (ver Reglas críticas).

**Permisos por acción (least privilege).** El scope de contexto define *qué* propiedades alcanza cada uno; el rol define *qué* puede hacer con ellas:

- **Crear** (`createProperty`): cualquier autenticado publica lo suyo (`ownerId = userId`). Form en `/properties/new`. Sujeto al **límite de plan** (ver "Plan / gating").
- **Editar** (`updateProperty`): el dueño (`ownerId`) o el `org:admin`. Form en `/properties/[id]/edit`. Solo toca el contenido (no `ownerId`/`organizationId`/`status`).
- **Cerrar** (`closeProperty`): marca `vendida`/`alquilada`. Dueño o `org:admin`.
- **Reabrir** (`reopenProperty`): vuelve a `activa` (inverso de cerrar). Dueño o `org:admin`.
- **Borrar** (`deleteProperty`): **solo `org:admin`** dentro de una inmobiliaria (irreversible); el propietario directo borra lo suyo. Un agente NO puede borrar.

Implementado en `app/actions.ts` con el helper `ownedOrAdminScope()` de `lib/property-scope.ts` (arma el `where` = contexto + dueño/admin) y un guard de rol en `deleteProperty`. La lectura (`findMany`) usa el scope de contexto más amplio: un agente ve todas las de la agencia aunque solo modifique las propias. Las acciones destructivas piden confirmación en la UI (componentes cliente con `window.confirm`).

## Plan / gating

- `FREE_LIMIT = 3` (`lib/plan.ts`): Free y cuentas personales publican hasta 3 propiedades.
- Feature `unlimited_properties` (plan Pro) → ilimitado.
- Chequeo **server-side** en `createProperty` (cuenta del contexto vía `has({ feature })`). En la UI: chip "X de 3"/"Ilimitado"; al llegar al límite, en vez del botón Publicar se muestra un aviso con link a `/pricing`. El check del servidor es la frontera real.

## UI / Diseño

- Referencia exacta de paleta y tipografías: **`desing/mockup-propiedades.html`**.
- **Paleta cálida** (tokens shadcn en `globals.css`): fondo avena, tarjetas pergamino, primario **verde pino** (`--primary`), texto carbón, bordes arena, **acento terracota** (`--terracotta`) para detalles. Modo oscuro: provisional (a afinar).
- **Tipografías**: Fraunces (headings → `font-serif`) + Hanken Grotesk (cuerpo → `font-sans`), cargadas con `next/font` en `layout.tsx` y ruteadas en `globals.css` (`@layer base`).
- **Header (shell)**: sticky, pergamino translúcido; marca "Hogar" (link a `/`); nav — Propiedades/Planes (logueados), Ajustes (`org:admin`), Plataforma (Super Admin) — + `OrganizationSwitcher`/`UserButton`. `<ClerkProvider>` con `appearance` (paleta) + `localization={esES}`.
- **Back-office `/admin`**: look propio **oscuro/neutro (slate)**, distinto de la marca cálida; encabezado en sans, tarjetas-resumen (métricas) y tabla de inmobiliarias. Incluye **borrar organización** (`deleteOrganization`): chequea `SUPER_ADMIN_IDS`, borra las propiedades de la org y luego la org en Clerk. Solo Super Admin, con confirmación.

## White-label

El branding por inmobiliaria (lema, color de acento) se guarda en el `publicMetadata` de la organización en Clerk, vía `updateOrganizationMetadata` (solo admin). Se lee de `organization.publicMetadata`. El `accentColor` pinta el título del portafolio (fallback al verde pino del tema); el resto usa la paleta. En cuenta personal no hay branding: se usan valores por defecto.

## Billing

Clerk Billing operativo. Planes "for Organizations" definidos en el dashboard. Página de precios con `<PricingTable />` en `/pricing`. Para gatear features por plan, usar `has({ plan })` o `has({ feature })` del lado del servidor.

## Cuando tengas dudas

Pará y preguntá antes de: tocar producción, cambiar el stack, modificar el modelo de datos de forma que rompa migraciones, o cualquier acción irreversible. Cambios chicos y verificables, probados en local.

## Tooling (MCP)

GitHub para versionado. Más adelante: Figma, Postman, Notion/Jira (roadmap).

#################################################################################################################################################################################################################################################################################################################


### ACTUALIZACION 4/6/2026

# CLAUDE.md

Guía del proyecto para Claude Code. Leé esto antes de tocar el código.

## Qué estamos construyendo

Un **portal inmobiliario** con dos caras, sobre un núcleo multi-tenant reutilizable:

- **Sitio público** (`/`, sin login): un único portal donde se navegan TODOS los avisos activos (de individuos y de inmobiliarias), con búsqueda y filtros, ficha de cada propiedad y formulario de consulta. Pensado para sumar más espacios públicos a futuro.
- **Panel de gestión** (`/dashboard/*`, con login): donde los publicadores administran sus propiedades, consultas, ajustes y branding.

Dos tipos de publicador conviven:
- **Propietario directo**: cuenta personal de Clerk (sin organización).
- **Inmobiliaria**: organización de Clerk (el tenant); sus agentes publican bajo la agencia.

(Cuentas personales habilitadas: "membership required" desactivado en Clerk.)

## Niveles de acceso

- **Super Admin** (plataforma): `SUPER_ADMIN_IDS`, chequeo server-side. Panel en `/dashboard/admin`.
- **Admin de inmobiliaria** (`org:admin`): gestiona su org, branding y ajustes (`/dashboard/settings`).
- **Agente** (`org:member`): publica y gestiona propiedades de su inmobiliaria.
- **Propietario directo** (cuenta personal): gestiona sus propias propiedades.

## Ruteo (route groups)

- `app/(public)/` — público, **sin login**: `/` (listado + búsqueda/filtros), `/propiedades/[code]` (ficha + formulario de consulta). Layout propio (logo, buscador, "Publicar"/"Ingresar").
- `app/(dashboard)/` — panel, **con login**, bajo `/dashboard`: home de gestión, `/dashboard/properties/new`, `/dashboard/properties/[id]/edit`, `/dashboard/settings`, `/dashboard/admin`, `/dashboard/pricing`, `/dashboard/consultas`. Header cálido (marca + switcher + user).
- `<ClerkProvider>` en el layout raíz.

## Stack

- Next.js 16 (App Router) + TypeScript. Sin `src/` (código en `app/`).
- Clerk: auth + organizaciones (= inmobiliarias) + Billing (planes "for Organizations"); localizado al español (`esES`).
- PostgreSQL en Neon + Prisma v7.
- Tailwind v4 + shadcn/ui. Fuentes: Fraunces (títulos) + Hanken Grotesk (cuerpo).
- Vercel Blob (fotos, client uploads). Resend (emails de consultas).
- Deploy: Vercel. Local: Windows, PowerShell, Node 22, pnpm.

## Gotchas del stack

- Middleware: `proxy.ts` (NO `middleware.ts`) en la raíz, con `clerkMiddleware()`. Rutas públicas accesibles sin login; `/dashboard/*` protegido.
- Prisma v7: cliente en `app/generated/prisma` (generator `prisma-client`); importar de `'../app/generated/prisma/client'`; adapter `@prisma/adapter-pg`; `DATABASE_URL` en `prisma.config.ts`.
- Cliente DB: singleton de `lib/prisma.ts`.
- **Cambios de schema en Windows**: frená el dev server, corré `migrate dev`/`generate`, reiniciá (el server bloquea los archivos del cliente generado).
- Variables en un único `.env`.

## Reglas críticas

- **Aislamiento por contexto** en el panel: toda query/mutación filtra por `organizationId: orgId` (org) o `ownerId: userId, organizationId: null` (personal); nunca por `id` solo. Helper `ownedOrAdminScope()`.
- **Excepciones cross-tenant intencionales** (solo estas): el listado/ficha públicos (filtran solo por `status: 'activa'`) y el panel Super Admin (gateado por `SUPER_ADMIN_IDS`).
- Permisos del lado del servidor; secretos en `.env`.

## Dominio

- **`Property`**: `title`, `address`, `price`, `operation` (venta/alquiler), `type` (casa/departamento/terreno/local), `status` (activa/vendida/alquilada), `bedrooms`/`bathrooms`/`area`, `images String[]` (URLs; la 1ª es portada), `code` (código público único), `locality` (de la lista en `lib/localities.ts`). Siempre con `ownerId` y `organizationId?` (null = propietario directo).
- Permisos: crear (cualquier autenticado, lo suyo); cerrar/reabrir (dueño o admin); borrar (solo `org:admin` en org, o el dueño en personal); editar (dueño o admin).
- **`Lead`** (consulta): `propertyId`, `name`, `email`, `phone?`, `message`, `createdAt`. Se crea desde la ficha pública (acción pública validada), se ven en `/dashboard/consultas` (scopeadas al owner) y se notifican por email (Resend) al destino de contacto del owner.

## Fotos

Subida **client-side** a Vercel Blob (`@vercel/blob/client`, vía `app/api/upload` con auth de Clerk en `onBeforeGenerateToken`). URLs en `Property.images`. Al borrar/editar propiedades o borrar orgs, se limpian los blobs con `del()`.

## White-label / Billing

- Branding por org (lema + color) en `publicMetadata`, vía `updateOrganizationMetadata` (solo admin).
- Clerk Billing; gating: límite de propiedades en Free, ilimitado con el feature `unlimited_properties` (Pro).

## Pendientes anotados

- **lead_from_email** (remitente verificado de Resend) — se define en la puesta a producción.
- **Avisos destacados / plan "Plus"** (C6) — pendiente de diseño.
- **Roles y permisos** — revisar alcance en Clerk y política de creación de organizaciones antes de producción.
- Onboarding de inmobiliarias; white-label ampliado; reordenar/portada de fotos.

## Cuando tengas dudas

Pará y preguntá antes de tocar producción, cambiar el stack, romper migraciones, o cualquier acción irreversible. Cambios chicos, verificables, probados en local.

