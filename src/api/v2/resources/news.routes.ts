// Recurso REST /api/v2/news sobre newsRepository.
//
// Endpoints:
//   GET    /            -> lista (filtro ?gad=; paginacion ?page=&size= con meta)
//   GET    /:id         -> 200 | 404 NOT_FOUND
//   POST   /            -> 201 (valida body)
//   PUT    /:id         -> 200 (valida body) | 404 NOT_FOUND
//   DELETE /:id         -> 204 | 404 NOT_FOUND

import { Router } from 'express'
import { z } from 'zod'
import newsRepository from '../../../repositories/news.repository'
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
  gad: objectId.optional()
})

const createBodySchema = z.object({
  image: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  tag: z.array(z.string()).optional(),
  author: objectId,
  gad: objectId
})

// PUT = reemplazo completo del recurso (mismo schema que create).
const updateBodySchema = createBodySchema

// --- Rutas ---

router.get(
  '/',
  validate({ query: listQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof listQuerySchema>
    const filter = query.gad !== undefined ? { gad: query.gad } : {}
    const pg = resolvePagination(query)

    if (!pg.enabled) {
      const items = await newsRepository.findAll(filter)
      return ok(res, items)
    }

    const { items, total } = await newsRepository.findPage(
      filter,
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
    const item = await newsRepository.findById(req.params.id)
    if (!item) {
      throw new NotFoundError('news not found')
    }
    return ok(res, item)
  })
)

router.post(
  '/',
  validate({ body: createBodySchema }),
  asyncHandler(async (req, res) => {
    const item = await newsRepository.create(req.body)
    return created(res, item)
  })
)

router.put(
  '/:id',
  validate({ params: idParamSchema, body: updateBodySchema }),
  asyncHandler(async (req, res) => {
    const updated = await newsRepository.updateById(req.params.id, req.body)
    if (!updated) {
      throw new NotFoundError('news not found')
    }
    return ok(res, updated)
  })
)

router.delete(
  '/:id',
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const deleted = await newsRepository.deleteById(req.params.id)
    if (!deleted) {
      throw new NotFoundError('news not found')
    }
    return noContent(res)
  })
)

export = router
