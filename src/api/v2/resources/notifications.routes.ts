// Recurso REST /api/v2/notifications sobre notificationRepository.
//
// Endpoints:
//   GET    /            -> lista (filtros ?sendTo= &state=; paginacion con meta)
//   GET    /:id         -> 200 | 404 NOT_FOUND
//   POST   /            -> 201 (valida body; `date` se fija en servidor)
//   PUT    /:id         -> 200 (valida body) | 404 NOT_FOUND
//   DELETE /:id         -> 204 | 404 NOT_FOUND

import { Router } from 'express'
import { z } from 'zod'
import notificationRepository from '../../../repositories/notification.repository'
import { NotFoundError } from '../../../utils/errors'
import { asyncHandler } from '../async-handler'
import { buildPaginationMeta, created, noContent, ok } from '../envelope'
import { paginationQuerySchema, resolvePagination } from '../pagination'
import { objectId } from '../schemas'
import { validate } from '../validate'

const router = Router()

// --- Schemas ---

const idParamSchema = z.object({
  id: z.string()
})

const listQuerySchema = paginationQuerySchema.extend({
  sendTo: objectId.optional(),
  state: z.coerce.number().int().optional()
})

const createBodySchema = z.object({
  type: z.number().int(),
  from: objectId.optional(),
  sendTo: objectId.optional(),
  content: z.string().min(1),
  itemType: z.number().int(),
  itemID: z.string().optional(),
  state: z.number().int()
})

// PUT = reemplazo completo del recurso (mismo schema que create).
const updateBodySchema = createBodySchema

// --- Rutas ---

router.get(
  '/',
  validate({ query: listQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof listQuerySchema>
    const filter: Record<string, unknown> = {}
    if (query.sendTo !== undefined) {
      filter.sendTo = query.sendTo
    }
    if (query.state !== undefined) {
      filter.state = query.state
    }
    const pg = resolvePagination(query)

    if (!pg.enabled) {
      const items = await notificationRepository.findAll(filter, {
        sort: { date: -1 }
      })
      return ok(res, items)
    }

    const { items, total } = await notificationRepository.findPage(
      filter,
      pg.page,
      pg.size,
      { sort: { date: -1 } }
    )
    return ok(res, items, {
      pagination: buildPaginationMeta(pg.page, pg.size, total)
    })
  })
)

router.get(
  '/:id',
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const item = await notificationRepository.findById(req.params.id)
    if (!item) {
      throw new NotFoundError('notification not found')
    }
    return ok(res, item)
  })
)

router.post(
  '/',
  validate({ body: createBodySchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof createBodySchema>
    const item = await notificationRepository.create({
      ...body,
      date: new Date()
    } as unknown as Parameters<typeof notificationRepository.create>[0])
    return created(res, item)
  })
)

router.put(
  '/:id',
  validate({ params: idParamSchema, body: updateBodySchema }),
  asyncHandler(async (req, res) => {
    const updated = await notificationRepository.updateById(
      req.params.id,
      req.body
    )
    if (!updated) {
      throw new NotFoundError('notification not found')
    }
    return ok(res, updated)
  })
)

router.delete(
  '/:id',
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const deleted = await notificationRepository.deleteById(req.params.id)
    if (!deleted) {
      throw new NotFoundError('notification not found')
    }
    return noContent(res)
  })
)

export = router
