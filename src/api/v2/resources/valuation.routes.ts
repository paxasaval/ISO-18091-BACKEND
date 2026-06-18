// Recurso REST /api/v2/valuation sobre la capa de datos v2
// (src/v2/repositories/valuation.repository -> coleccion v2_valuations).
//
// Acepta slug/order (HC#5) y ORDENA los listados por order asc (luego name).
//
// Endpoints:
//   GET    /            -> lista ORDENADA por order asc (luego name);
//                          paginacion ?page=&size= con meta
//   GET    /:id         -> 200 | 404 NOT_FOUND
//   POST   /            -> 201 (valida body, incluye slug/order)
//   PUT    /:id         -> 200 (valida body) | 404 NOT_FOUND
//   DELETE /:id         -> 204 | 404 NOT_FOUND

import { Router } from 'express'
import { z } from 'zod'
import valuationRepository from '../../../v2/repositories/valuation.repository'
import { NotFoundError } from '../../../utils/errors'
import { asyncHandler } from '../async-handler'
import { buildPaginationMeta, created, noContent, ok } from '../envelope'
import { paginationQuerySchema, resolvePagination } from '../pagination'
import { validate } from '../validate'

const router = Router()

// Orden estable del catalogo: por order asc, desempate por name.
const CATALOG_SORT: Record<string, 1 | -1> = { order: 1, name: 1 }

// --- Schemas ---

const idParamSchema = z.object({
  id: z.string()
})

const listQuerySchema = paginationQuerySchema

const createBodySchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  maxValue: z.number(),
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
    const pg = resolvePagination(query)

    if (!pg.enabled) {
      const items = await valuationRepository.findAll({}, { sort: CATALOG_SORT })
      return ok(res, items)
    }

    const { items, total } = await valuationRepository.findPage(
      {},
      pg.page,
      pg.size,
      { sort: CATALOG_SORT }
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
    const item = await valuationRepository.findById(req.params.id)
    if (!item) {
      throw new NotFoundError('valuation not found')
    }
    return ok(res, item)
  })
)

router.post(
  '/',
  validate({ body: createBodySchema }),
  asyncHandler(async (req, res) => {
    const item = await valuationRepository.create(req.body)
    return created(res, item)
  })
)

router.put(
  '/:id',
  validate({ params: idParamSchema, body: updateBodySchema }),
  asyncHandler(async (req, res) => {
    const updated = await valuationRepository.updateById(req.params.id, req.body)
    if (!updated) {
      throw new NotFoundError('valuation not found')
    }
    return ok(res, updated)
  })
)

router.delete(
  '/:id',
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const deleted = await valuationRepository.deleteById(req.params.id)
    if (!deleted) {
      throw new NotFoundError('valuation not found')
    }
    return noContent(res)
  })
)

export = router
