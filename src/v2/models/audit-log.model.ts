// Entidad NUEVA v2: AuditLog. Coleccion 'v2_audit_log'.
// Registro append-only (solo insert) de acciones de calificar/verificar/publicar
// y de cada propagacion de verified. Base de trazabilidad ISO.
import mongoose, { Document, Schema } from 'mongoose'

interface IAuditLogV2 extends Document {
  actor: mongoose.Types.ObjectId
  action: string
  entityType: string
  entityId: mongoose.Types.ObjectId
  timestamp: Date
  meta?: unknown
}

const auditLogSchema = new Schema<IAuditLogV2>({
  actor: {
    type: Schema.Types.ObjectId,
    ref: 'UserV2',
    required: true
  },
  action: {
    type: String,
    required: true
  },
  entityType: {
    type: String,
    required: true
  },
  entityId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  timestamp: {
    type: Date,
    required: false,
    default: Date.now
  },
  meta: {
    type: Schema.Types.Mixed,
    required: false
  }
})

auditLogSchema.set('toJSON', {
  transform: (doc, returnObj) => {
    if (returnObj._id) {
      returnObj.id = returnObj._id.toString()
      delete returnObj._id
      delete returnObj.__v
    }
  }
})

export = mongoose.model<IAuditLogV2>('AuditLogV2', auditLogSchema, 'v2_audit_log')
