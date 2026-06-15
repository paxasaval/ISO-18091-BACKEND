// Recurso REST /api/v2/rubric sobre rubricRepository.
//
// Endpoints:
//   GET    /            -> lista (paginacion ?page=&size= con meta)
//   GET    /:id         -> 200 | 404 NOT_FOUND
//   POST   /            -> 201 (valida body)
//   PUT    /:id         -> 200 (valida body) | 404 NOT_FOUND
//   DELETE /:id         -> 204 | 404 NOT_FOUND

import { Router } from 'express'
import { z } from 'zod'
import rubricRepository from '../../../repositories/rubric.repository'
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

const listQuerySchema = paginationQuerySchema

const createBodySchema = z.object({
  valuation: objectId,
  qualification: z.number(),
  evidence: objectId
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
      const items = await rubricRepository.findAll()
      return ok(res, items)
    }

    const { items, total } = await rubricRepository.findPage(
      {},
      pg.page,
      pg.size
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
    const item = await rubricRepository.findById(req.params.id)
    if (!item) {
      throw new NotFoundError('rubric not found')
    }
    return ok(res, item)
  })
)

router.post(
  '/',
  validate({ body: createBodySchema }),
  asyncHandler(async (req, res) => {
    const item = await rubricRepository.create(req.body)
    return created(res, item)
  })
)

router.put(
  '/:id',
  validate({ params: idParamSchema, body: updateBodySchema }),
  asyncHandler(async (req, res) => {
    const updated = await rubricRepository.updateById(req.params.id, req.body)
    if (!updated) {
      throw new NotFoundError('rubric not found')
    }
    return ok(res, updated)
  })
)

router.delete(
  '/:id',
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const deleted = await rubricRepository.deleteById(req.params.id)
    if (!deleted) {
      throw new NotFoundError('rubric not found')
    }
    return noContent(res)
  })
)

export = router
