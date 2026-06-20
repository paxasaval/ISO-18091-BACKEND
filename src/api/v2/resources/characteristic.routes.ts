// Recurso REST /api/v2/characteristics sobre la capa de datos v2
// (src/v2/repositories/characteristic.repository -> coleccion
// v2_characteristics).
//
// Nombres limpios: valuations (antes valuation), allowedFormats (antes
// allowed_formats). Nuevos campos de presentacion/workflow (HC#7/#8/#9):
//   - inputKind: 'file' | 'link' (reemplaza el type===2 numerico legacy)
//   - allowedFormats: string[]   (formatos aceptados)
//   - isCover?: boolean          (marca de portada)
//   - slug?, order?              (catalogo navegable/ordenable)
//
// Endpoints:
//   GET    /                  -> lista (?type=<id> filtra; paginacion ?page=&size=)
//   GET    /:id               -> 200 (valuations pobladas) | 404 NOT_FOUND
//   POST   /                  -> authenticate + requirePermission('catalog:manage'); 201
//   PUT    /:id               -> authenticate + requirePermission('catalog:manage'); 200 | 404
//   DELETE /:id               -> authenticate + requirePermission('catalog:manage'); 204 | 404
//   PATCH  /:id/valuation     -> authenticate + requirePermission('rubric:configure'); 200 | 404
//   PATCH  /:id/inputKind     -> authenticate + requirePermission('catalog:manage'); 200 | 404
//   PATCH  /:id/format        -> authenticate + requirePermission('catalog:manage'); 200 | 404
//   PATCH  /:id/extras        -> authenticate + requirePermission('catalog:manage'); 200 | 404
//
// Decisión: PATCH /valuation usa 'rubric:configure' porque modificar la
// asociación de valoraciones es una tarea de metodólogo (configura criterios).
// El resto de mutaciones de estructura del catálogo usan 'catalog:manage'.
// Auditoría: POST, PUT, DELETE, PATCH registran en v2_audit_log.

import { Router } from 'express'
import { z } from 'zod'
import characteristicRepository from '../../../v2/repositories/characteristic.repository'
import { NotFoundError } from '../../../utils/errors'
import { authenticate, requirePermission } from '../auth'
import { asyncHandler } from '../async-handler'
import { buildPaginationMeta, created, noContent, ok } from '../envelope'
import { paginationQuerySchema, resolvePagination } from '../pagination'
import { objectId } from '../schemas'
import { validate } from '../validate'
import auditService from '../../../v2/services/audit.service'

const router = Router()

// --- Schemas ---

const idParamSchema = z.object({
  id: z.string()
})

const listQuerySchema = paginationQuerySchema.extend({
  type: z.string().optional()
})

const inputKindSchema = z.enum(['file', 'link'])

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
  valuations: z.array(objectId),
  allowedFormats: z.array(z.string()),
  inputKind: inputKindSchema.optional(),
  isCover: z.boolean().optional(),
  slug: z.string().min(1).optional(),
  order: z.number().int().optional()
})

// PUT = reemplazo (mismos campos editables, con los nuevos de presentacion).
const updateBodySchema = z.object({
  name: z.string().min(1),
  group: z.string().min(1),
  groupName: z.string().min(1),
  required: z.boolean(),
  score: z.number().optional(),
  tier: z.number(),
  isRequired: z.boolean(),
  unique: z.boolean(),
  inputKind: inputKindSchema.optional(),
  isCover: z.boolean().optional(),
  slug: z.string().min(1).optional(),
  order: z.number().int().optional()
})

const valuationBodySchema = z.object({
  valuations: z.array(objectId)
})
const inputKindBodySchema = z.object({
  inputKind: inputKindSchema
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
    const filter = query.type !== undefined ? { typeId: query.type } : {}
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
    const item = await characteristicRepository.findByIdWithValuations(
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
  requirePermission('catalog:manage'),
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
      valuations: body.valuations,
      allowedFormats: body.allowedFormats,
      inputKind: body.inputKind,
      isCover: body.isCover,
      slug: body.slug,
      order: body.order
    } as unknown as Parameters<typeof characteristicRepository.create>[0])
    await auditService.record({
      actor: req.token!.id,
      action: 'characteristic.create',
      entityType: 'characteristic',
      entityId: (item as unknown as { _id: { toString(): string } })._id.toString()
    })
    return created(res, item)
  })
)

router.put(
  '/:id',
  authenticate,
  requirePermission('catalog:manage'),
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
      unique: body.unique,
      inputKind: body.inputKind,
      isCover: body.isCover,
      slug: body.slug,
      order: body.order
    } as unknown as Parameters<typeof characteristicRepository.updateById>[1])
    if (!updated) {
      throw new NotFoundError('characteristic not found')
    }
    await auditService.record({
      actor: req.token!.id,
      action: 'characteristic.update',
      entityType: 'characteristic',
      entityId: req.params.id
    })
    return ok(res, updated)
  })
)

router.delete(
  '/:id',
  authenticate,
  requirePermission('catalog:manage'),
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const deleted = await characteristicRepository.deleteById(req.params.id)
    if (!deleted) {
      throw new NotFoundError('characteristic not found')
    }
    await auditService.record({
      actor: req.token!.id,
      action: 'characteristic.delete',
      entityType: 'characteristic',
      entityId: req.params.id
    })
    return noContent(res)
  })
)

// --- PATCH por campo ---

// PATCH /valuation: modifica la asociación de valoraciones (criterios de
// rúbrica) → permiso 'rubric:configure' (tarea del metodólogo).
router.patch(
  '/:id/valuation',
  authenticate,
  requirePermission('rubric:configure'),
  validate({ params: idParamSchema, body: valuationBodySchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof valuationBodySchema>
    const updated = await characteristicRepository.updateValuations(
      req.params.id,
      body.valuations as unknown as Parameters<
        typeof characteristicRepository.updateValuations
      >[1]
    )
    if (!updated) {
      throw new NotFoundError('characteristic not found')
    }
    await auditService.record({
      actor: req.token!.id,
      action: 'characteristic.valuation.update',
      entityType: 'characteristic',
      entityId: req.params.id
    })
    return ok(res, updated)
  })
)

router.patch(
  '/:id/inputKind',
  authenticate,
  requirePermission('catalog:manage'),
  validate({ params: idParamSchema, body: inputKindBodySchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof inputKindBodySchema>
    const updated = await characteristicRepository.updateInputKind(
      req.params.id,
      body.inputKind
    )
    if (!updated) {
      throw new NotFoundError('characteristic not found')
    }
    await auditService.record({
      actor: req.token!.id,
      action: 'characteristic.inputKind.update',
      entityType: 'characteristic',
      entityId: req.params.id
    })
    return ok(res, updated)
  })
)

router.patch(
  '/:id/format',
  authenticate,
  requirePermission('catalog:manage'),
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
    await auditService.record({
      actor: req.token!.id,
      action: 'characteristic.format.update',
      entityType: 'characteristic',
      entityId: req.params.id
    })
    return ok(res, updated)
  })
)

router.patch(
  '/:id/extras',
  authenticate,
  requirePermission('catalog:manage'),
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
    await auditService.record({
      actor: req.token!.id,
      action: 'characteristic.extras.update',
      entityType: 'characteristic',
      entityId: req.params.id
    })
    return ok(res, updated)
  })
)

export = router
