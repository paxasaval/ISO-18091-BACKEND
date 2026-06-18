// Recurso REST /api/v2/notifications sobre la capa de datos v2
// (src/v2/repositories/notification.repository -> coleccion v2_notifications).
//
// Ademas de los `type`/`itemType` numericos del contrato legacy, v2 expone y
// acepta enums etiquetados (HC#14): `entityType` (indicator|subindicator|
// evidence) y `action` (added|modified|deleted). El mapeo numerico<->etiqueta
// vive en src/v2/constants/notification.
//
// Endpoints:
//   GET    /            -> lista (filtros ?sendTo= &state=; paginacion con meta)
//   GET    /:id         -> 200 | 404 NOT_FOUND
//   POST   /            -> 201 (valida body; `date` se fija en servidor)
//   PUT    /:id         -> 200 (valida body) | 404 NOT_FOUND
//   DELETE /:id         -> 204 | 404 NOT_FOUND

import { Router } from 'express'
import { z } from 'zod'
import notificationRepository from '../../../v2/repositories/notification.repository'
import {
  ACTION_TO_TYPE,
  ENTITY_TO_ITEM_TYPE,
  NOTIFICATION_ACTIONS,
  ENTITY_TYPES,
  EntityType,
  NotificationAction,
  actionFromType,
  entityTypeFromItemType
} from '../../../v2/constants/notification'
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

// Body: el cliente puede enviar los numericos (type/itemType) o las etiquetas
// (action/entityType). Si llega la etiqueta, se deriva el numerico equivalente.
const createBodySchema = z.object({
  type: z.number().int().optional(),
  action: z.enum(NOTIFICATION_ACTIONS as unknown as [string, ...string[]]).optional(),
  from: objectId.optional(),
  sendTo: objectId.optional(),
  content: z.string().min(1),
  itemType: z.number().int().optional(),
  entityType: z.enum(ENTITY_TYPES as unknown as [string, ...string[]]).optional(),
  itemID: z.string().optional(),
  state: z.number().int()
})

// PUT = reemplazo completo del recurso (mismo schema que create).
const updateBodySchema = createBodySchema

type NotificationBody = z.infer<typeof createBodySchema>

// Normaliza el body: completa type/itemType desde action/entityType (y al
// reves) y persiste tanto los numericos como las etiquetas para compat total.
const normalizeBody = (
  body: NotificationBody
): Record<string, unknown> => {
  const type =
    body.type ??
    (body.action ? ACTION_TO_TYPE[body.action as NotificationAction] : undefined)
  const itemType =
    body.itemType ??
    (body.entityType
      ? ENTITY_TO_ITEM_TYPE[body.entityType as EntityType]
      : undefined)
  const action = body.action ?? actionFromType(type)
  const entityType = body.entityType ?? entityTypeFromItemType(itemType)
  return {
    type,
    itemType,
    action,
    entityType,
    from: body.from,
    sendTo: body.sendTo,
    content: body.content,
    itemID: body.itemID,
    state: body.state
  }
}

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
    const body = req.body as NotificationBody
    const item = await notificationRepository.create({
      ...normalizeBody(body),
      date: new Date()
    } as unknown as Parameters<typeof notificationRepository.create>[0])
    return created(res, item)
  })
)

router.put(
  '/:id',
  validate({ params: idParamSchema, body: updateBodySchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as NotificationBody
    const updated = await notificationRepository.updateById(
      req.params.id,
      normalizeBody(body)
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
