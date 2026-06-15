// Recurso REST /api/v2/characteristics sobre characteristicRepository.
//
// Endpoints:
//   GET    /                  -> lista (?type=<id> filtra; paginacion ?page=&size=)
//   GET    /:id               -> 200 (valuation poblada) | 404 NOT_FOUND
//   POST   /                  -> 201 (valida body)
//   PUT    /:id               -> 200 (reemplazo) | 404 NOT_FOUND
//   DELETE /:id               -> 204 | 404 NOT_FOUND
//   PATCH  /:id/valuation     -> 200 (reemplaza valuation) | 404
//   PATCH  /:id/type          -> 200 (reemplaza type) | 404
//   PATCH  /:id/format        -> 200 (reemplaza format) | 404
//   PATCH  /:id/extras        -> 200 (reemplaza extras) | 404
//
// Decision REST: los POST de actualizacion por campo del legacy
// (/addValuationArray, /changeType, /changeFormat, /addExtra con ?id=) se
// convierten en PATCH coherentes por subruta sobre el recurso identificado por
// :id.

import { Router } from 'express'
import { z } from 'zod'
import characteristicRepository from '../../../repositories/characteristic.repository'
import { NotFoundError } from '../../../utils/errors'
import { authenticate, requireElevatedRole } from '../auth'
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
  type: z.string().optional()
})

const createBodySchema = z.object({
  name: z.string().min(1),
  group: z.string().min(1),
  groupName: z.string().min(1),
  score: z.number().optional(),
  help: z.string().optional(),
  isRequired: z.boolean().optional(),
  required: z.boolean().optional(),
  tier: z.number(),
  unique: z.boolean().optional(),
  parts: z.array(z.string()).optional(),
  valuation: z.array(objectId),
  allowed_formats: z.array(z.string())
})

// PUT = reemplazo (mismos campos editables del legacy PUT /:id).
const updateBodySchema = z.object({
  name: z.string().min(1),
  group: z.string().min(1),
  groupName: z.string().min(1),
  required: z.boolean(),
  score: z.number().optional(),
  tier: z.number(),
  isRequired: z.boolean(),
  unique: z.boolean()
})

const valuationBodySchema = z.object({
  valuation: z.array(objectId)
})
const typeBodySchema = z.object({
  type: z.number()
})
const formatBodySchema = z.object({
  format: z.string()
})
const extrasBodySchema = z.object({
  extras: z.unknown()
})

// --- Rutas ---

router.get(
  '/',
  validate({ query: listQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof listQuerySchema>
    const filter = query.type !== undefined ? { typeID: query.type } : {}
    const pg = resolvePagination(query)

    if (!pg.enabled) {
      const items = await characteristicRepository.findAll(filter)
      return ok(res, items)
    }

    const { items, total } = await characteristicRepository.findPage(
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
    const item = await characteristicRepository.findByIdWithValuation(
      req.params.id
    )
    if (!item) {
      throw new NotFoundError('characteristic not found')
    }
    return ok(res, item)
  })
)

router.post(
  '/',
  authenticate,
  requireElevatedRole,
  validate({ body: createBodySchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof createBodySchema>
    const item = await characteristicRepository.create({
      name: body.name,
      group: body.group,
      groupName: body.groupName,
      score: body.score ?? 0,
      help: body.help ?? '',
      isRequired: body.isRequired ?? true,
      required: body.required ?? true,
      tier: body.tier,
      unique: body.unique ?? false,
      parts: body.parts ?? [],
      valuation: body.valuation,
      allowed_formats: body.allowed_formats
    } as unknown as Parameters<typeof characteristicRepository.create>[0])
    return created(res, item)
  })
)

router.put(
  '/:id',
  authenticate,
  requireElevatedRole,
  validate({ params: idParamSchema, body: updateBodySchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof updateBodySchema>
    const updated = await characteristicRepository.updateById(req.params.id, {
      name: body.name,
      group: body.group,
      groupName: body.groupName,
      required: body.required,
      score: body.score ?? 0,
      tier: body.tier,
      isRequired: body.isRequired,
      unique: body.unique
    })
    if (!updated) {
      throw new NotFoundError('characteristic not found')
    }
    return ok(res, updated)
  })
)

router.delete(
  '/:id',
  authenticate,
  requireElevatedRole,
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const deleted = await characteristicRepository.deleteById(req.params.id)
    if (!deleted) {
      throw new NotFoundError('characteristic not found')
    }
    return noContent(res)
  })
)

// --- PATCH por campo ---

router.patch(
  '/:id/valuation',
  authenticate,
  requireElevatedRole,
  validate({ params: idParamSchema, body: valuationBodySchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof valuationBodySchema>
    const updated = await characteristicRepository.updateValuation(
      req.params.id,
      body.valuation as unknown as Parameters<
        typeof characteristicRepository.updateValuation
      >[1]
    )
    if (!updated) {
      throw new NotFoundError('characteristic not found')
    }
    return ok(res, updated)
  })
)

router.patch(
  '/:id/type',
  authenticate,
  requireElevatedRole,
  validate({ params: idParamSchema, body: typeBodySchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof typeBodySchema>
    const updated = await characteristicRepository.updateType(
      req.params.id,
      body.type
    )
    if (!updated) {
      throw new NotFoundError('characteristic not found')
    }
    return ok(res, updated)
  })
)

router.patch(
  '/:id/format',
  authenticate,
  requireElevatedRole,
  validate({ params: idParamSchema, body: formatBodySchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof formatBodySchema>
    const updated = await characteristicRepository.updateFormat(
      req.params.id,
      body.format
    )
    if (!updated) {
      throw new NotFoundError('characteristic not found')
    }
    return ok(res, updated)
  })
)

router.patch(
  '/:id/extras',
  authenticate,
  requireElevatedRole,
  validate({ params: idParamSchema, body: extrasBodySchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof extrasBodySchema>
    const updated = await characteristicRepository.updateExtras(
      req.params.id,
      body.extras
    )
    if (!updated) {
      throw new NotFoundError('characteristic not found')
    }
    return ok(res, updated)
  })
)

export = router
