// Servicio de auditoría append-only de /api/v2.
//
// Solo inserta; NUNCA actualiza ni borra documentos de audit_log.
// Los handlers que lo usan llaman audit.record(...) despues de la mutacion
// para no interferir con el flujo de respuesta en caso de fallo del log.
//
// Campo 'actor': ObjectId del usuario que realiza la accion (req.token.id).
// Campo 'action': verbo semantico (p.ej. 'user.create', 'gad.config.update').
// Campo 'entityType': nombre del recurso ('user', 'gad', 'type', ...).
// Campo 'entityId': ObjectId del documento afectado.
// Campo 'meta': datos adicionales opcionales (diff parcial, params, etc.).

import mongoose from 'mongoose'
import AuditLog from '../models/audit-log.model'
import logger from '../../utils/logger'

export interface AuditRecordInput {
  actor: string
  action: string
  entityType: string
  entityId: string
  meta?: Record<string, unknown>
}

/**
 * Registra una entrada de auditoría inmutable en v2_audit_log.
 * Silencia el error (solo log) para no interrumpir la respuesta HTTP.
 */
const record = async (input: AuditRecordInput): Promise<void> => {
  try {
    await new AuditLog({
      actor: new mongoose.Types.ObjectId(input.actor),
      action: input.action,
      entityType: input.entityType,
      entityId: new mongoose.Types.ObjectId(input.entityId),
      meta: input.meta,
      timestamp: new Date()
    }).save()
  } catch (err) {
    // El fallo de auditoría no debe interrumpir la respuesta HTTP.
    const msg = err instanceof Error ? err.message : String(err)
    logger.error(`audit.record failed: ${msg}`)
  }
}

const auditService = { record }
export default auditService
