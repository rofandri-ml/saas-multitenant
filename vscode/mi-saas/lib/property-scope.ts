// Scope de aislamiento por contexto para la entidad Property (least privilege):
//  - sin org (propietario directo): solo las propias.
//  - org admin: todas las de la org.
//  - org member: solo las propias dentro de la org.
// SIEMPRE se combina con el id; nunca se opera por id solo.
// Fuente única de verdad del scope: la usan las Server Actions (actions.ts) y la
// página de edición (findFirst). No la dupliques.
export function ownedOrAdminScope(
  id: string,
  userId: string,
  orgId: string | null | undefined,
  orgRole: string | null | undefined,
) {
  if (!orgId) return { id, ownerId: userId, organizationId: null }
  if (orgRole === 'org:admin') return { id, organizationId: orgId }
  return { id, organizationId: orgId, ownerId: userId }
}
