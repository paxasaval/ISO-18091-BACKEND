// Constantes y mapeos de notificaciones v2 (HC#14).
//
// El FE/legacy usa `type` e `itemType` numericos. v2 expone ademas etiquetas
// estables y legibles:
//   - entityType: a que entidad se refiere la notificacion (deriva de itemType).
//   - action:     que paso con esa entidad (deriva de type).
//
// Este modulo es la UNICA fuente de verdad del mapeo numerico <-> etiqueta y se
// reutiliza desde el recurso REST. El mapeo numerico replica el contrato legacy.

// --- entityType (itemType numerico) ---
export type EntityType = 'indicator' | 'subindicator' | 'evidence'

// itemType numerico -> entityType etiquetado.
export const ITEM_TYPE_TO_ENTITY: Record<number, EntityType> = {
  1: 'indicator',
  2: 'subindicator',
  3: 'evidence'
}

export const ENTITY_TO_ITEM_TYPE: Record<EntityType, number> = {
  indicator: 1,
  subindicator: 2,
  evidence: 3
}

// --- action (type numerico) ---
export type NotificationAction = 'added' | 'modified' | 'deleted'

// type numerico -> action etiquetada.
export const TYPE_TO_ACTION: Record<number, NotificationAction> = {
  1: 'added',
  2: 'modified',
  3: 'deleted'
}

export const ACTION_TO_TYPE: Record<NotificationAction, number> = {
  added: 1,
  modified: 2,
  deleted: 3
}

export const ENTITY_TYPES: readonly EntityType[] = [
  'indicator',
  'subindicator',
  'evidence'
] as const

export const NOTIFICATION_ACTIONS: readonly NotificationAction[] = [
  'added',
  'modified',
  'deleted'
] as const

// Helpers de derivacion. Devuelven undefined si el numerico no esta mapeado.
export const entityTypeFromItemType = (
  itemType?: number
): EntityType | undefined =>
  itemType === undefined ? undefined : ITEM_TYPE_TO_ENTITY[itemType]

export const actionFromType = (
  type?: number
): NotificationAction | undefined =>
  type === undefined ? undefined : TYPE_TO_ACTION[type]
