// Recurso REST /api/v2/gad sobre gadRepository.
//
// Endpoints:
//   GET    /                 -> lista (paginacion ?page=&size= con meta)
//   GET    /:id              -> 200 | 404 NOT_FOUND
//   POST   /                 -> 201 (valida body)
//   PUT    /:id              -> 200 (valida body) | 404 NOT_FOUND
//   DELETE /:id              -> 204 | 404 NOT_FOUND
//   GET    /:id/reports      -> 200 (reports poblados) | 404 NOT_FOUND
//   POST   /:id/reports      -> 201 (crea Report y lo enlaza al gad) | 404
//   PUT    /:id/config       -> 200 (reportDefault + publishAuto) | 404
//
// REST: en el legacy reports y config se resolvian por header 'tenant'; aqui se
// modelan como subrecursos/atributos del gad identificado por :id.

import { Router } from 'express'
import { z } from 'zod'
import gadRepository from '../../../repositories/gad.repository'
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

const listQuerySchema = paginationQuerySchema

const createBodySchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  city: z.string().min(1),
  country: z.string().min(1),
  size: z.coerce.number(),
  publishAuto: z.boolean().optional()
})

// PUT = reemplazo: preserva los campos editables del legacy PUT /:id.
const updateBodySchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  city: z.string().min(1),
  country: z.string().min(1),
  size: z.coerce.number()
})

const infoSchema = z.object({
  label: z.string(),
  data: z.string()
})

const createReportBodySchema = z.object({
  source: z.string().min(1),
  period: z.string().min(1),
  info: z.array(infoSchema)
})

const configBodySchema = z.object({
  reportDefault: objectId,
  publishAuto: z.boolean()
})

// --- Rutas ---

router.get(
  '/',
  validate({ query: listQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof listQuerySchema>
    const pg = resolvePagination(query)

    if (!pg.enabled) {
      const items = await gadRepository.findAll()
      return ok(res, items)
    }

    const { items, total } = await gadRepository.findPage({}, pg.page, pg.size)
    return ok(res, items, {
      pagination: buildPaginationMeta(pg.page, pg.size, total)
    })
  })
)

router.get(
  '/:id',
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const gad = await gadRepository.findById(req.params.id)
    if (!gad) {
      throw new NotFoundError('gad not found')
    }
    return ok(res, gad)
  })
)

router.post(
  '/',
  authenticate,
  requireElevatedRole,
  validate({ body: createBodySchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof createBodySchema>
    const gad = await gadRepository.create({
      name: body.name,
      code: body.code,
      city: body.city,
      country: body.country,
      size: body.size,
      staff: [],
      users: [],
      state: true,
      publishAuto: body.publishAuto ?? true,
      report: []
    } as unknown as Parameters<typeof gadRepository.create>[0])
    return created(res, gad)
  })
)

router.put(
  '/:id',
  authenticate,
  requireElevatedRole,
  validate({ params: idParamSchema, body: updateBodySchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof updateBodySchema>
    const updated = await gadRepository.updateById(req.params.id, {
      name: body.name,
      code: body.code,
      city: body.city,
      country: body.country,
      size: body.size
    })
    if (!updated) {
      throw new NotFoundError('gad not found')
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
    const deleted = await gadRepository.deleteById(req.params.id)
    if (!deleted) {
      throw new NotFoundError('gad not found')
    }
    return noContent(res)
  })
)

// --- Subrecurso reports ---

router.get(
  '/:id/reports',
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const gad = await gadRepository.findByIdWithReports(req.params.id)
    if (!gad) {
      throw new NotFoundError('gad not found')
    }
    return ok(res, gad.report)
  })
)

router.post(
  '/:id/reports',
  authenticate,
  requireElevatedRole,
  validate({ params: idParamSchema, body: createReportBodySchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof createReportBodySchema>
    const report = await gadRepository.createReport({
      source: body.source,
      period: body.period,
      info: body.info
    })
    const updated = await gadRepository.addReportToGad(req.params.id, report)
    if (!updated) {
      throw new NotFoundError('gad not found')
    }
    return created(res, report)
  })
)

// --- Config (publishAuto / reportDefault) ---

router.put(
  '/:id/config',
  authenticate,
  requireElevatedRole,
  validate({ params: idParamSchema, body: configBodySchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof configBodySchema>
    const updated = await gadRepository.updateConfig(
      req.params.id,
      body.reportDefault,
      body.publishAuto
    )
    if (!updated) {
      throw new NotFoundError('gad not found')
    }
    return ok(res, updated)
  })
)

export = router
