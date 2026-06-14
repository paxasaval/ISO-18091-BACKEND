// Tipos de notificacion segun la funcion notify de utils/middleware.js.

// type: que operacion provoco la notificacion.
// 1 = agregado, 2 = modificado, 3 = eliminado.
export enum NotificationType {
  Added = 1,
  Modified = 2,
  Deleted = 3
}

// itemType: sobre que entidad recae la notificacion.
// 1 = indicador, 2 = subindicador, 3 = evidencia.
export enum NotificationItemType {
  Indicator = 1,
  Subindicator = 2,
  Evidence = 3
}
