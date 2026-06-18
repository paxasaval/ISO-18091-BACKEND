// Recurso REST /api/v2/indicators sobre la capa de datos v2
// (src/v2/repositories/indicator.repository -> coleccion v2_indicators).
//
// Acepta slug/order (HC#5) y ORDENA los listados por order asc (luego number).
//
// Endpoints:
//   GET    /            -> lista (?quadrant=) ORDENADA por order asc (luego
//                          number); paginacion ?page=&size= con meta
//   GET    /:id         -> 200 | 404 NOT_FOUND
//   POST   /            -> 201 (valida body, incluye slug/order)
//   PUT    /:id         -> 200 (valida body) | 404 NOT_FOUND
//   DELETE /:id         -> 204

import { Router } from 'express'
import { z } from 'zod'
import indicatorRepository from '../../../v2/repositories/indicator.repository'
import { NotFoundError } from '../../../utils/errors'
import { asyncHandler } from '../async-handler'
import { buildPaginationMeta, created, noContent, ok } from '../envelope'
import { paginationQuerySchema, resolvePagination } from '../pagination'
import { validate } from '../validate'

const router = Router()

// Orden estable del catalogo: por order asc, desempate por number.
const CATALOG_SORT: Record<string, 1 | -1> = { order: 1, number: 1 }

// --- Schemas ---

const idParamSchema = z.object({
  id: z.string()
})

const listQuerySchema = paginationQuerySchema.extend({
  quadrant: z.coerce.number().int().optional()
})

const odsSchema = z.array(z.string()).optional()

const createBodySchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  number: z.number().int(),
  quadrant: z.number().int(),
  quadrantName: z.string().min(1),
  red: z.string().min(1),
  yellow: z.string().min(1),
  green: z.string().min(1),
  ods: odsSchema,
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
      query.quadrant !== undefined ? { quadrant: query.quadrant } : {}
    const pg = resolvePagination(query)

    if (!pg.enabled) {
      const items = await indicatorRepository.findAll(filter, {
        populate: 'ods',
        sort: CATALOG_SORT
      })
      return ok(res, items)
    }

    const { items, total } = await indicatorRepository.findPage(
      filter,
      pg.page,
      pg.size,
      { populate: 'ods', sort: CATALOG_SORT }
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
    const indicator = await indicatorRepository.findByIdWithOds(req.params.id)
    if (!indicator) {
      throw new NotFoundError('indicator not found')
    }
    return ok(res, indicator)
  })
)

router.post(
  '/',
  validate({ body: createBodySchema }),
  asyncHandler(async (req, res) => {
    const indicator = await indicatorRepository.create(req.body)
    return created(res, indicator)
  })
)

router.put(
  '/:id',
  validate({ params: idParamSchema, body: updateBodySchema }),
  asyncHandler(async (req, res) => {
    const updated = await indicatorRepository.updateById(req.params.id, req.body)
    if (!updated) {
      throw new NotFoundError('indicator not found')
    }
    return ok(res, updated)
  })
)

router.delete(
  '/:id',
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const deleted = await indicatorRepository.deleteById(req.params.id)
    if (!deleted) {
      throw new NotFoundError('indicator not found')
    }
    return noContent(res)
  })
)

export = router
