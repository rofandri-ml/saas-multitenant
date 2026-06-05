# Plan completo — SaaS inmobiliario (guía para Claude Code)

Guía para avanzar con Claude Code paso a paso. Cada tarea está pensada para
copiar y pegar **de a una**. Después de cada una: revisá el diff, probá en local,
y commiteá antes de seguir.

---

## Cómo usar esta guía

1. Pegá **una tarea por vez** en Claude Code. No le pases varias juntas.
2. **Revisá el diff** antes de aceptar, sobre todo en acciones que tocan datos
   (que el `where` lleve siempre el scope, nunca por `id` solo).
3. Las **migraciones las corrés vos** con el flujo seguro de Windows:
   frená el dev server → `npx prisma migrate dev --name x` → arrancá de nuevo.
4. Mantené el **CLAUDE.md actualizado** a medida que cambian las cosas (Claude
   Code se guía por él).
5. Commiteá cada paso que quede funcionando (puntos de retorno).

---

## Estado actual (lo que ya está hecho)

- **Stack**: Next.js 16 (App Router) + TypeScript, Clerk (auth + orgs + billing),
  Prisma v7 + Neon, Tailwind v4 + shadcn/ui, deploy previsto en Vercel.
- **Multi-tenant dual**: propietario directo (cuenta personal) e inmobiliaria
  (organización). Niveles: Super Admin (`SUPER_ADMIN_IDS`), `org:admin`,
  `org:member`, propietario directo.
- **Propiedades**: alta (`/properties/new`), edición (`/properties/[id]/edit`),
  listado (home), borrar (solo admin en org, con confirmación), cerrar/reabrir
  (vendida/alquilada/activa), least-privilege con `ownedOrAdminScope()`.
- **White-label**: lema + color de acento por org (publicMetadata).
- **Billing + gating**: Clerk Billing; límite de propiedades en Free, ilimitado
  con el feature `unlimited_properties` (Pro).
- **Panel Super Admin** (`/admin`): métricas + borrar organizaciones.
- **Rediseño** "cálido y confiable": Fraunces + Hanken Grotesk, verde pino,
  terracota, fondo avena; header con navegación; admin con estilo neutro.
- **Fotos**: campo `images String[]`, subida client-side a Vercel Blob, portada
  en la tarjeta, limpieza de blobs al borrar/editar.
- **Idioma**: Clerk localizado a español (`esES`).

---

## Recordatorios transversales (valen para TODAS las tareas)

Pegá esto como contexto si hace falta, o confiá en que Claude Code lee el CLAUDE.md:

- Aislamiento por contexto: toda query filtra por `organizationId` (org) o
  `ownerId + organizationId:null` (personal). Nunca por `id` solo.
- Permisos del lado del servidor; la UI solo oculta, no protege.
- Secretos solo en `.env`.
- No cambiar el schema ni correr migraciones sin avisar (las corrés vos).

---

## FASE A — Pulir la gestión interna

### A1 · Pulido de UX

```
Pulí la experiencia de la gestión interna SIN tocar la lógica de scope ni permisos. Reglas del CLAUDE.md.
- Estados vacíos claros y amables (sin propiedades, sin miembros, etc.).
- Estados de carga: en los formularios, botón con estado "Guardando…"/deshabilitado mientras procesa (useFormStatus o equivalente).
- Validación con mensajes claros (campos requeridos, precio numérico, etc.), cliente y servidor.
- Coherencia visual: que home, /properties/new, /properties/[id]/edit, /settings y /admin usen los componentes shadcn y la paleta de forma consistente.
No toques Server Actions, scope ni el modelo de permisos. No corras migraciones.
```

### A2 · (Opcional) Vista de miembros para el admin

```
Agregá una página /members visible solo para org:admin, que muestre el <OrganizationProfile /> de Clerk (gestión de miembros e invitaciones) sin salir de la app, estilada con la paleta cálida y enlazada desde el header (visible solo para org:admin). No toques la lógica de auth. No corras migraciones.
```

### A3 · Verificación de cabos sueltos

Confirmá a mano que estos estén (si falta alguno, pedíselo a Claude Code):
- Al publicar en `/properties/new` vuelve al home (`redirect('/')`).
- El título del home toma el `accentColor` de la org si está configurado.
- El término "Ambientes/amb." está unificado en formulario y tarjeta.

---

## FASE B — Ficha de propiedad + galería

### B1 · Página de detalle

```
Creá la ficha de propiedad en app/properties/[id]/page.tsx: una página de detalle que muestre TODAS las fotos en una galería (carrusel o grilla con vista ampliada), más título, dirección, precio, operación, tipo, ambientes/baños/superficie, descripción completa y el badge de estado. Cargá la propiedad con findFirst usando el scope del contexto (como en la página de edición); si no existe o no está en el scope, redirect('/'). Hacé que cada tarjeta del listado (home) enlace a esta ficha. Estilo coherente con la marca (Fraunces, paleta cálida, componentes shadcn). Reglas del CLAUDE.md; no toques Server Actions ni el modelo. No corras migraciones.
```

> Esta ficha es interna por ahora (detrás del login, con scope). En la Fase C se
> adapta para la versión pública. Por eso conviene dejarla limpia y reutilizable.

---

## FASE C — Portal público  ⚠️ VOLVÉ ACÁ PARA ARRANCARLA

Esta fase tiene decisiones de arquitectura que conviene tomar juntos, así que
**no la encares solo con Claude Code todavía**. La idea general:

- Sitio **de cara al cliente** (sin login) donde se navegan los avisos, se busca
  y filtra, se ve la ficha pública y se consulta por una propiedad.
- Separar lo público de lo privado con **route groups** (`app/(public)/` y el
  panel actual aparte, con layouts distintos).

Decisiones a definir cuando volvamos (traé ideas):
1. ¿El sitio público es **uno por inmobiliaria** (cada agencia con su dominio y
   su marca, mostrando solo sus avisos) o **un portal único** con todas? Por lo
   que venís contando (un dominio de un dueño), apunta a **uno por inmobiliaria**
   con dominio propio — eso define toda la arquitectura.
2. Búsqueda y filtros (operación, tipo, precio, ambientes, zona).
3. Captura de **consultas/leads** (formulario de contacto por propiedad → ¿a dónde
   van esas consultas?).
4. Revisar juntos el sitio de referencia (elsitiodelacosta.com renovado) para
   replicar y mejorar su estructura.

---

## FASE D — Salida a producción  ⚠️ VOLVÉ ACÁ PARA EL GO-LIVE

Checklist (es delicado; conviene guiarlo paso a paso):

- [ ] **Clerk producción**: crear la instancia de producción, claves de prod,
      configurar el dominio (hoy estás con claves de desarrollo).
- [ ] **Vercel**: deploy del proyecto + **dominio propio** + plan **Pro** (el
      Hobby es solo no comercial).
- [ ] **Variables de entorno de producción**: Clerk prod, `DATABASE_URL` (¿base
      de prod separada en Neon?), `BLOB_READ_WRITE_TOKEN`, Stripe.
- [ ] **Stripe real**: sacar el billing de modo test.
- [ ] **Idioma del Account Portal** de Clerk (si usás páginas alojadas): se setea
      en el dashboard, no con la prop de localización.
- [ ] **Migración de datos** del sitio actual (elsitiodelacosta.com) a la nueva base.
- [ ] **Onboarding de inmobiliarias**: definir cómo una agencia nueva obtiene su
      organización + plan (hoy la creación de orgs está restringida).

---

## Backlog / pendientes anotados

- **White-label ampliado**: que el color de la agencia tiña más que el título
  (o un set curado de colores que combinen con la paleta), en vez de uno libre.
- **Fotos**: reordenar, elegir portada, borrar fotos individuales; pasar de
  `images String[]` a un modelo `PropertyImage` si se queda corto.
- **Modo oscuro**: afinar el bloque `.dark` + toggle (opcional, baja prioridad).
- **tw-animate-css**: animación de apertura del Select de shadcn (cosmético).
- **Leads / consultas** y **búsqueda/filtros** (van con el portal público).

---

## Cuándo volver acá

- Para **arrancar el portal público** (decisiones de arquitectura + revisar el
  sitio de referencia).
- Para el **go-live a producción** (checklist delicado, mejor guiado).
- Ante cualquier **duda puntual o bug** que no resuelvas con Claude Code.

Mientras tanto, dale con las Fases A y B tranquilo. ¡Éxitos!