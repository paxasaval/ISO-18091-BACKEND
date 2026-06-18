// Recurso REST /api/v2/commit sobre commitRepository.
//
// Endpoints:
//   GET    /            -> lista (paginacion ?page=&size= con meta)
//   GET    /:id         -> 200 | 404 NOT_FOUND
//   POST   /            -> 201 (valida body; `created` se fija en servidor)
//   PUT    /:id         -> 200 (valida body; `lastUpdate` se fija) | 404
//   DELETE /:id         -> 204 | 404 NOT_FOUND

import { Router } from 'express'
import { z } from 'zod'
import commitRepository from '../../../v2/repositories/commit.repository'
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
  body: z.string().min(1),
  author: objectId
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
      const items = await commitRepository.findAll()
      return ok(res, items)
    }

    const { items, total } = await commitRepository.findPage(
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
    const item = await commitRepository.findById(req.params.id)
    if (!item) {
      throw new NotFoundError('commit not found')
    }
    return ok(res, item)
  })
)

router.post(
  '/',
  validate({ body: createBodySchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof createBodySchema>
    const item = await commitRepository.create({
      ...body,
      created: new Date()
    } as unknown as Parameters<typeof commitRepository.create>[0])
    return created(res, item)
  })
)

router.put(
  '/:id',
  validate({ params: idParamSchema, body: updateBodySchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof updateBodySchema>
    const updated = await commitRepository.updateById(req.params.id, {
      ...body,
      lastUpdate: new Date()
    })
    if (!updated) {
      throw new NotFoundError('commit not found')
    }
    return ok(res, updated)
  })
)

router.delete(
  '/:id',
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const deleted = await commitRepository.deleteById(req.params.id)
    if (!deleted) {
      throw new NotFoundError('commit not found')
    }
    return noContent(res)
  })
)

export = router
