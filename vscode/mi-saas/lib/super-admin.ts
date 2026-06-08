// Fuente única de verdad del gate de Super Admin (dueño de la plataforma).
// Se identifica por SUPER_ADMIN_IDS (IDs de usuario de Clerk separados por coma),
// chequeado SIEMPRE en el servidor. Además del back-office /dashboard/admin, le da
// poderes cross-tenant ("god-mode") sobre las propiedades: ver y gestionar TODAS,
// sin importar la org ni el owner. Nunca confiar solo en la UI: el gate real va en
// las queries/mutaciones del servidor.
export function isSuperAdmin(userId: string | null | undefined): boolean {
  if (!userId) return false
  return (process.env.SUPER_ADMIN_IDS ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
    .includes(userId)
}
