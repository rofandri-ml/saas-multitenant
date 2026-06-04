#################################################################################################################################################################################################################################################################################################################


### ACTUALIZACION 3/6/2026

> ⚠️ **SUPERADO POR EL BLOQUE `4/6/2026` (más abajo). NO USAR.**
> Se conserva solo como historial. En particular, su regla *"TODA consulta filtra por
> `organizationId`"* quedó **obsoleta**: el contexto de cuenta personal usa
> `organizationId: null` (scope por `ownerId`). La guía vigente es la del 4/6.

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

#################################################################################################################################################################################################################################################################################################################


### ACTUALIZACION 4/6/2026



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
- **Auth + multi-tenancy + billing**: Clerk. Organizations = inmobiliarias. Billing con Clerk Billing (Stripe por debajo), planes "for Organizations".
- **Base de datos**: PostgreSQL en Neon, con Prisma v7.
- **UI**: Tailwind CSS v4 (sin archivo de config; se configura desde el CSS).
- **Deploy**: Vercel.
- **Entorno local**: Windows nativo, terminal PowerShell, Node 22, pnpm.

## Detalles del stack que importan (gotchas)

- **Middleware**: en Next.js 16 el archivo se llama `proxy.ts` (NO `middleware.ts`), en la raíz. Usa `clerkMiddleware()`.
- **Prisma v7**: el cliente se genera en `app/generated/prisma` (generator `prisma-client`). Importar SIEMPRE desde `'../app/generated/prisma/client'` (con `/client`). La conexión usa `@prisma/adapter-pg`. La `DATABASE_URL` va en `prisma.config.ts` (lee `.env` vía dotenv), NO en el `datasource` del schema.
- **Cliente de DB**: usar siempre el singleton de `lib/prisma.ts`.
- **Cambios de schema (importante, en Windows)**: editar el schema NO actualiza nada por sí solo. Tras un cambio: **frená el dev server** (mantiene abiertos los archivos del cliente generado y bloquea la regeneración), corré el comando, y volvé a arrancar.
  - `npx prisma migrate dev --name x` → crea/cambia la tabla en Neon **y** regenera el cliente.
  - `npx prisma generate` → solo regenera el cliente (cuando la tabla ya existe pero el cliente quedó viejo).
- **Entorno**: todas las variables en un único `.env` en la raíz. El `.env.example` solo tiene placeholders.

## Estructura

- `app/` — rutas y páginas (App Router)
- `app/admin/` — panel de Super Admin (todas las inmobiliarias)
- `app/settings/` — personalización del tenant (white-label, solo admin)
- `app/pricing/` — tabla de planes (`<PricingTable />` de Clerk)
- `app/actions.ts`, `app/settings/actions.ts` — Server Actions
- `lib/prisma.ts` — cliente de Prisma (singleton)
- `prisma/` — `schema.prisma` y migraciones
- `app/generated/prisma/` — cliente generado (NO versionar)

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

- **Crear**: cualquier autenticado publica lo suyo (`ownerId = userId`). Agente y propietario directo por igual.
- **Cerrar** (marcar `vendida`/`alquilada`): el dueño (`ownerId`) o el `org:admin`. Un agente solo cierra las propias.
- **Borrar**: **solo `org:admin`** dentro de una inmobiliaria (es irreversible); el propietario directo borra lo suyo. Un agente NO puede borrar.

Implementado en `app/actions.ts` con el helper `ownedOrAdminScope()` (arma el `where` = contexto + dueño/admin) y un guard de rol en `deleteProperty`. La lectura (`findMany`) usa el scope de contexto más amplio: un agente ve todas las de la agencia aunque solo modifique las propias. Las acciones destructivas piden confirmación en la UI.

## White-label

El branding por inmobiliaria (lema, color) se guarda en el `publicMetadata` de la organización en Clerk, vía `updateOrganizationMetadata` (solo admin). Se lee de `organization.publicMetadata`. En cuenta personal no hay branding: se usan valores por defecto.

## Billing

Clerk Billing operativo. Planes "for Organizations" definidos en el dashboard. Página de precios con `<PricingTable />` en `/pricing`. Para gatear features por plan, usar `has({ plan })` o `has({ feature })` del lado del servidor.

## Cuando tengas dudas

Pará y preguntá antes de: tocar producción, cambiar el stack, modificar el modelo de datos de forma que rompa migraciones, o cualquier acción irreversible. Cambios chicos y verificables, probados en local.

## Tooling (MCP)

GitHub para versionado. Más adelante: Figma, Postman, Notion/Jira (roadmap).