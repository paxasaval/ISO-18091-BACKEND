// Repositorio v2 de AuditLog (coleccion audit-log.model).
import AuditLog from '../models/audit-log.model'
import BaseRepository, { ModelDocType } from './base.repository'

type AuditLogDoc = ModelDocType<typeof AuditLog>

export class AuditLogRepository extends BaseRepository<AuditLogDoc> {
  constructor() {
    super(AuditLog)
  }
}

export const auditLogRepository = new AuditLogRepository()
export default auditLogRepository
