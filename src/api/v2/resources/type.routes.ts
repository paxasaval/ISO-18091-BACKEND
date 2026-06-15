// Recurso REST /api/v2/type sobre typeRepository.
//
// Endpoints:
//   GET    /            -> lista con characteristics pobladas
//                          (paginacion ?page=&size= con meta)
//   GET    /:id         -> 200 (characteristics pobladas) | 404 NOT_FOUND
//   POST   /            -> 201 (valida body)
//   PUT    /:id         -> 200 (valida body) | 404 NOT_FOUND
//   DELETE /:id         -> 204 | 404 NOT_FOUND

import { Router } from 'express'
import { z } from 'zod'
import typeRepository from '../../../repositories/type.repository'
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
  name: z.string().min(1),
  red: z.string().min(1),
  yellow: z.string().min(1),
  green: z.string().min(1),
  mandatory: z.boolean(),
  extraInfo: z.unknown().optional(),
  characteristics: z.array(objectId).optional()
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
      const items = await typeRepository.findAll(
        {},
        { populate: 'characteristics' }
      )
      return ok(res, items)
    }

    const { items, total } = await typeRepository.findPage(
      {},
      pg.page,
      pg.size,
      { populate: 'characteristics' }
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
    const item = await typeRepository.findByIdWithCharacteristics(req.params.id)
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
