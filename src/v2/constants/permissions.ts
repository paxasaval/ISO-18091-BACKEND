// Catálogo de permisos de la plataforma ISO 18091.
//
// Cada string es una capacidad atómica. Los guards de /api/v2 gatean por
// permiso (requirePermission), no por nombre de rol, de modo que agregar un
// nuevo rol o mover un permiso entre roles NO requiere cambiar los guards.
//
// Permisos diferidos (no cableados aún en recursos complejos):
//   - evidence:qualify  → Tema 5: quien califica una evidencia (≠ autor).
//   - evidence:publish  → Tema 5: quien publica resultado final.
//   - subindicator:create → Tema 4: Responsable crea subindicadores.
//   - indicator:create  → Tema 4: futuro, creación de indicadores.
// Cuando evidence/subindicator se re-apunten a la capa v2 (Temas 5/4) se
// añadirá requirePermission('evidence:qualify'|'evidence:publish') en esos
// handlers; la regla author ≠ qualificationBy y responsibleUserIds también se
// cablean en ese momento (no aquí).

// --- Constantes de permiso ---

export const PERM_INDICATOR_CREATE = 'indicator:create'
export const PERM_SUBINDICATOR_CREATE = 'subindicator:create'
export const PERM_EVIDENCE_UPLOAD = 'evidence:upload'
export const PERM_EVIDENCE_QUALIFY = 'evidence:qualify'
export const PERM_EVIDENCE_PUBLISH = 'evidence:publish'
export const PERM_GAD_CONFIG = 'gad:config'
export const PERM_RUBRIC_CONFIGURE = 'rubric:configure'
export const PERM_CATALOG_MANAGE = 'catalog:manage'
export const PERM_USER_MANAGE = 'user:manage'
export const PERM_PUBLIC_READ = 'public:read'

// Lista completa de permisos de la plataforma.
export const ALL_PERMISSIONS: readonly string[] = [
  PERM_INDICATOR_CREATE,
  PERM_SUBINDICATOR_CREATE,
  PERM_EVIDENCE_UPLOAD,
  PERM_EVIDENCE_QUALIFY,
  PERM_EVIDENCE_PUBLISH,
  PERM_GAD_CONFIG,
  PERM_RUBRIC_CONFIGURE,
  PERM_CATALOG_MANAGE,
  PERM_USER_MANAGE,
  PERM_PUBLIC_READ,
] as const

// --- Mapeo rol → permisos por defecto ---
//
// Roles reconocidos: 'Administrador', 'Responsable', 'Metodólogo', 'Ciudadano'.
// Si el nombre de rol no coincide se devuelve el mínimo (public:read).
// Este mapeo es la única fuente de verdad para seed y para futuros scripts de
// backfill de permisos en la colección v2_rols.

const PERMISSIONS_BY_ROLE: Record<string, readonly string[]> = {
  Administrador: ALL_PERMISSIONS,
  // Responsable: sube evidencias, crea subindicadores, lee.
  Responsable: [
    PERM_SUBINDICATOR_CREATE,
    PERM_EVIDENCE_UPLOAD,
    PERM_PUBLIC_READ,
  ],
  // Metodólogo: configura rúbrica y catálogo, lee.
  // Decisión: 'rubric:configure' y 'catalog:manage' van aquí porque el
  // metodólogo es quien define criterios y estructuras, no quien opera datos
  // de campo.
  Metodólogo: [
    PERM_RUBRIC_CONFIGURE,
    PERM_CATALOG_MANAGE,
    PERM_PUBLIC_READ,
  ],
  // Ciudadano: solo lectura pública.
  Ciudadano: [PERM_PUBLIC_READ],
}

/**
 * Devuelve los permisos por defecto para el rol dado.
 * Si el nombre no existe en el mapeo, retorna [public:read] (mínimo seguro).
 *
 * Uso: seed-v2, scripts de backfill.
 */
export const permissionsForRole = (name: string): string[] => {
  const perms = PERMISSIONS_BY_ROLE[name]
  return perms ? [...perms] : [PERM_PUBLIC_READ]
}
