// Recurso REST /api/v2/types (alias /api/v2/type) sobre la capa de datos v2
// (src/v2/repositories/type.repository -> coleccion v2_types).
//
// Catalogo navegable de tipos. El FE arma rutas desde este catalogo usando
// id/slug (resuelve HC#1/#2). Cada tipo expone slug y order.
//
// Endpoints:
//   GET    /?mandatory=true|false -> lista filtrada por mandatory, ORDENADA por
//                                    order asc (luego name), characteristics
//                                    pobladas. Paginacion ?page=&size= con meta.
//   GET    /:id                   -> 200 (characteristics pobladas) | 404
//   POST   /                      -> 201 (valida body, incluye slug/order)
//   PUT    /:id                   -> 200 (valida body) | 404 NOT_FOUND
//   DELETE /:id                   -> 204 | 404 NOT_FOUND

import { Router } from 'express'
import { z } from 'zod'
import typeRepository from '../../../v2/repositories/type.repository'
import { NotFoundError } from '../../../utils/errors'
import { asyncHandler } from '../async-handler'
import { buildPaginationMeta, created, noContent, ok } from '../envelope'
import { paginationQuerySchema, resolvePagination } from '../pagination'
import { objectId } from '../schemas'
import { validate } from '../validate'

const router = Router()

// Orden estable del catalogo: por order asc, desempate por name.
const CATALOG_SORT: Record<string, 1 | -1> = { order: 1, name: 1 }

// --- Schemas ---

const idParamSchema = z.object({
  id: z.string()
})

// ?mandatory=true|false (coercion desde string de query) + paginacion opcional.
const listQuerySchema = paginationQuerySchema.extend({
  mandatory: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional()
})

const createBodySchema = z.object({
  name: z.string().min(1),
  red: z.string().min(1),
  yellow: z.string().min(1),
  green: z.string().min(1),
  mandatory: z.boolean(),
  extraInfo: z.unknown().optional(),
  characteristics: z.array(objectId).optional(),
  slug: z.string().min(1).optional(),
  order: z.number().int().optional()
})

// PUT = reemplazo completo del recurso (mismo schema que create).
const updateBodySchema = createBodySchema

// --- Rutas ---

router.get(
  '/',
  validate({ query: listQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof listQuerySchema>
    const filter =
      query.mandatory === undefined ? {} : { mandatory: query.mandatory }
    const findOptions = { populate: 'characteristics', sort: CATALOG_SORT }
    const pg = resolvePagination(query)

    if (!pg.enabled) {
      const items = await typeRepository.findAll(filter, findOptions)
      return ok(res, items)
    }

    const { items, total } = await typeRepository.findPage(
      filter,
      pg.page,
      pg.size,
      findOptions
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
    const item = await typeRepository.findById(req.params.id, {
      populate: 'characteristics'
    })
    if (!item) {
      throw new NotFoundError('type not found')
    }
    return ok(res, item)
  })
)

router.post(
  '/',
  validate({ body: createBodySchema }),
  asyncHandler(async (req, res) => {
    const item = await typeRepository.create(req.body)
    return created(res, item)
  })
)

router.put(
  '/:id',
  validate({ params: idParamSchema, body: updateBodySchema }),
  asyncHandler(async (req, res) => {
    const updated = await typeRepository.updateById(req.params.id, req.body)
    if (!updated) {
      throw new NotFoundError('type not found')
    }
    return ok(res, updated)
  })
)

router.delete(
  '/:id',
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const deleted = await typeRepository.deleteById(req.params.id)
    if (!deleted) {
      throw new NotFoundError('type not found')
    }
    return noContent(res)
  })
)

export = router
