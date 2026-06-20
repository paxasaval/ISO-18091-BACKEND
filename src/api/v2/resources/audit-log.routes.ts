// Recurso REST /api/v2/audit-log (solo lectura; append-only).
//
// Endpoint:
//   GET /  -> lista paginada del registro de auditoría de v2_audit_log.
//             Requiere authenticate + requirePermission('user:manage').
//             Paginacion ?page=&size= con meta.pagination.
//             ?entityType= y ?action= como filtros opcionales.
//
// No existe PUT/DELETE: la colección es inmutable por diseño (trazabilidad ISO).
// Los inserts los realiza audit.service.ts desde los handlers de mutación.

import { Router } from 'express'
import { z } from 'zod'
import auditLogRepository from '../../../v2/repositories/audit-log.repository'
import { authenticate, requirePermission } from '../auth'
import { asyncHandler } from '../async-handler'
import { buildPaginationMeta, ok } from '../envelope'
import { paginationQuerySchema, resolvePagination } from '../pagination'
import { validate } from '../validate'

const router = Router()

// --- Schemas ---

const listQuerySchema = paginationQuerySchema.extend({
  entityType: z.string().optional(),
  action: z.string().optional()
})

// --- Rutas ---

router.get(
  '/',
  authenticate,
  requirePermission('user:manage'),
  validate({ query: listQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof listQuerySchema>
    const filter: Record<string, unknown> = {}
    if (query.entityType !== undefined) {
      filter.entityType = query.entityType
    }
    if (query.action !== undefined) {
      filter.action = query.action
    }

    const pg = resolvePagination(query)
    const sort: Record<string, 1 | -1> = { timestamp: -1 }

    if (!pg.enabled) {
      const items = await auditLogRepository.findAll(filter, { sort })
      return ok(res, items)
    }

    const { items, total } = await auditLogRepository.findPage(
      filter,
      pg.page,
      pg.size,
      { sort }
    )
    return ok(res, items, {
      pagination: buildPaginationMeta(pg.page, pg.size, total)
    })
  })
)

export = router
