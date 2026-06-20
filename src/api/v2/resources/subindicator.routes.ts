// Recurso REST /api/v2/subindicators re-apuntado a la capa v2
// (SubindicatorV2 / v2_subindicators).
//
// Endpoints:
//   GET    /                       -> lista. Filtros:
//                                       ?indicator=<id> -> por indicatorInstanceId
//                                       ?type=general   -> mandatory===true
//                                       ?type=specific  -> mandatory===false
//                                     paginacion ?page=&size= con meta.
//   GET    /:id                    -> 200 (populate profundo) | 404 NOT_FOUND
//   POST   /                       -> authenticate + requirePermission('subindicator:create')
//                                     crea y enlaza a IndicatorInstanceV2. 201.
//   PUT    /:id                    -> authenticate + requirePermission('subindicator:create')
//                                     200 (reemplazo) | 404 NOT_FOUND
//   DELETE /:id                    -> authenticate + requirePermission('subindicator:create')
//                                     204 | 404 NOT_FOUND
//
// Nombres limpios: indicatorInstanceId, typeId, responsibleText, responsibleUserIds.
// responsibleUserIds: expuesto en respuesta y aceptado en create/update (Tema 3).
//
// Los aggregates general/specific se re-implementan sobre v2_subindicators usando
// los nombres de campo v2 (typeId, indicatorInstanceId).

import mongoose, { PipelineStage } from 'mongoose'
import { Router } from 'express'
import { z } from 'zod'
import { subindicatorRepository } from '../../../v2/repositories/subindicator.repository'
import { indicatorInstanceRepository } from '../../../v2/repositories/indicator-instance.repository'
import SubindicatorV2 from '../../../v2/models/subindicator.model'
import TypeV2 from '../../../v2/models/type.model'
import { NotFoundError, UnauthorizedError, ValidationError } from '../../../utils/errors'
import { authenticate, requirePermission } from '../auth'
import { asyncHandler } from '../async-handler'
import { buildPaginationMeta, created, noContent, ok } from '../envelope'
import { paginationQuerySchema, resolvePagination } from '../pagination'
import { objectId } from '../schemas'
import { validate } from '../validate'

const router = Router()

// --- Schemas ---

const idParamSchema = z.object({
  id: objectId
})

const listQuerySchema = paginationQuerySchema.extend({
  indicator: objectId.optional(),
  type: z.enum(['general', 'specific']).optional()
})

const createBodySchema = z.object({
  indicatorInstanceId: objectId,
  typeId: objectId,
  name: z.string().min(1),
  responsibleText: z.string().optional(),
  responsibleUserIds: z.array(objectId).optional(),
  qualification: z.number().optional(),
  requireCover: z.boolean().optional(),
  cover: z.string().optional(),
  observationCover: z.string().optional(),
  isPlanned: z.boolean().optional(),
  isDiagnosed: z.boolean().optional(),
  commits: z.array(objectId).optional(),
  evidences: z.array(objectId).optional()
})

const updateBodySchema = z.object({
  name: z.string().min(1).optional(),
  responsibleText: z.string().optional(),
  responsibleUserIds: z.array(objectId).optional(),
  typeId: objectId.optional(),
  qualification: z.number().optional(),
  commits: z.array(objectId).optional(),
  evidences: z.array(objectId).optional()
}).refine(
  (val) => Object.keys(val).length > 0,
  { message: 'at least one field is required' }
)

const toObjectIds = (ids?: string[]): mongoose.Types.ObjectId[] =>
  (ids ?? []).map((id) => new mongoose.Types.ObjectId(id))

// ---------------------------------------------------------------------------
// Aggregates v2 (replican el patron del repo legacy sobre colecciones v2_*)
// ---------------------------------------------------------------------------

// Construye el aggregate de general (mandatory===true) o specific (mandatory===false)
// sobre v2_subindicators.
const buildMandatoryAggregateV2 = (
  indicatorInstanceId: string,
  mandatory: boolean
): Promise<unknown[]> => {
  const select = { __v: 0 }
  const pipeline: PipelineStage[] = [
    {
      $match: {
        indicatorInstanceId: new mongoose.Types.ObjectId(indicatorInstanceId)
      }
    },
    {
      $lookup: {
        from: 'v2_evidences',
        localField: 'evidences',
        foreignField: '_id',
        as: 'evidences',
        pipeline: [{ $project: select }]
      }
    },
    {
      $lookup: {
        from: 'v2_types',
        localField: 'typeId',
        foreignField: '_id',
        as: 'typeId',
        pipeline: [{ $project: select }]
      }
    },
    { $unwind: { path: '$typeId', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'v2_characteristics',
        localField: 'typeId.characteristics',
        foreignField: '_id',
        as: 'typeId.characteristics',
        pipeline: [{ $project: select }]
      }
    },
    { $match: { 'typeId.mandatory': mandatory } },
    {
      $lookup: {
        from: 'v2_users',
        localField: 'createdBy',
        foreignField: '_id',
        as: 'createdBy',
        pipeline: [{ $project: { __v: 0, password: 0 } }]
      }
    },
    { $unwind: { path: '$createdBy', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        id: '$_id',
        indicatorInstanceId: 1,
        requireCover: 1,
        cover: 1,
        observationCover: 1,
        typeId: 1,
        name: 1,
        responsibleText: 1,
        responsibleUserIds: 1,
        qualification: 1,
        score: 1,
        totalScore: 1,
        created: 1,
        lastUpdate: 1,
        state: 1,
        createdBy: 1,
        commits: 1,
        evidences: 1,
        _id: 0
      }
    }
  ]
  return SubindicatorV2.aggregate(pipeline).exec()
}

const buildSpecificPaginatedV2 = (
  indicatorInstanceId: string,
  offset: number,
  limit: number
): Promise<unknown[]> => {
  const select = { __v: 0 }
  const pipeline: PipelineStage[] = [
    {
      $match: {
        indicatorInstanceId: new mongoose.Types.ObjectId(indicatorInstanceId)
      }
    },
    {
      $lookup: {
        from: 'v2_evidences',
        localField: 'evidences',
        foreignField: '_id',
        as: 'evidences',
        pipeline: [{ $project: select }]
      }
    },
    {
      $lookup: {
        from: 'v2_types',
        localField: 'typeId',
        foreignField: '_id',
        as: 'typeId',
        pipeline: [{ $project: select }]
      }
    },
    { $unwind: { path: '$typeId', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'v2_characteristics',
        localField: 'typeId.characteristics',
        foreignField: '_id',
        as: 'typeId.characteristics',
        pipeline: [{ $project: select }]
      }
    },
    { $match: { 'typeId.mandatory': false } },
    {
      $lookup: {
        from: 'v2_users',
        localField: 'createdBy',
        foreignField: '_id',
        as: 'createdBy',
        pipeline: [{ $project: { __v: 0, password: 0 } }]
      }
    },
    { $unwind: { path: '$createdBy', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        id: '$_id',
        indicatorInstanceId: 1,
        requireCover: 1,
        cover: 1,
        observationCover: 1,
        typeId: 1,
        name: 1,
        responsibleText: 1,
        responsibleUserIds: 1,
        qualification: 1,
        score: 1,
        totalScore: 1,
        created: 1,
        lastUpdate: 1,
        state: 1,
        createdBy: 1,
        commits: 1,
        evidences: 1,
        _id: 0
      }
    },
    {
      $facet: {
        totalCount: [{ $count: 'count' }],
        results: [{ $skip: offset }, { $limit: limit }]
      }
    }
  ]
  return SubindicatorV2.aggregate(pipeline).exec()
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Enlaza el subindicador creado a la IndicatorInstanceV2.
const linkSubToInstance = async (
  instanceId: mongoose.Types.ObjectId,
  subId: mongoose.Types.ObjectId
): Promise<void> => {
  await indicatorInstanceRepository.updateById(instanceId.toString(), {
    $push: { subindicators: subId }
  } as unknown as Parameters<typeof indicatorInstanceRepository.updateById>[1])
}

// ---------------------------------------------------------------------------
// Rutas
// ---------------------------------------------------------------------------

router.get(
  '/',
  validate({ query: listQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof listQuerySchema>
    const pg = resolvePagination(query)
    const page = pg.page
    const size = pg.size
    const offset = (page - 1) * size

    // Aggregates por tipo requieren indicador objetivo.
    if (query.type) {
      if (!query.indicator) {
        throw new ValidationError('indicator is required for type aggregates')
      }
      if (query.type === 'general') {
        const items = await buildMandatoryAggregateV2(query.indicator, true)
        return ok(res, items)
      }
      // specific: paginated via $facet
      const data = (await buildSpecificPaginatedV2(
        query.indicator,
        offset,
        size
      )) as Array<{ totalCount: Array<{ count: number }>; results: unknown[] }>
      const total = data[0]?.totalCount[0]?.count ?? 0
      const results = data[0]?.results ?? []
      return ok(res, results, {
        pagination: buildPaginationMeta(page, size, total)
      })
    }

    const filter = query.indicator
      ? { indicatorInstanceId: new mongoose.Types.ObjectId(query.indicator) }
      : {}

    if (!pg.enabled) {
      const items = await subindicatorRepository.findAll(filter, {
        populate: [
          { path: 'evidences', model: 'EvidenceV2' },
          { path: 'typeId', populate: { path: 'characteristics' } },
          { path: 'createdBy', select: 'name email' },
          { path: 'responsibleUserIds', select: 'name email' }
        ]
      })
      return ok(res, items)
    }

    const { items, total } = await subindicatorRepository.findPage(
      filter,
      page,
      size,
      {
        populate: [
          { path: 'evidences', model: 'EvidenceV2' },
          { path: 'typeId', populate: { path: 'characteristics' } },
          { path: 'createdBy', select: 'name email' },
          { path: 'responsibleUserIds', select: 'name email' }
        ]
      }
    )
    return ok(res, items, {
      pagination: buildPaginationMeta(page, size, total)
    })
  })
)

router.get(
  '/:id',
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const item = await subindicatorRepository.findById(req.params.id, {
      populate: [
        { path: 'evidences', model: 'EvidenceV2' },
        { path: 'typeId', populate: { path: 'characteristics' } },
        { path: 'createdBy', select: 'name email' },
        { path: 'responsibleUserIds', select: 'name email' },
        { path: 'indicatorInstanceId' }
      ]
    })
    if (!item) {
      throw new NotFoundError('subindicator not found')
    }
    return ok(res, item)
  })
)

router.post(
  '/',
  authenticate,
  requirePermission('subindicator:create'),
  validate({ body: createBodySchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof createBodySchema>
    const userId = req.token?.id
    if (!userId) {
      throw new UnauthorizedError('token missing or invalid')
    }
    const user = new mongoose.Types.ObjectId(userId)
    const now = new Date()

    // Verificar que el Type existe en v2.
    const type = await TypeV2.findById(body.typeId).exec()
    if (!type) {
      throw new NotFoundError('type not found')
    }

    // Verificar que la IndicatorInstance existe en v2.
    const instance = await indicatorInstanceRepository.findById(body.indicatorInstanceId)
    if (!instance) {
      throw new NotFoundError('indicator instance not found')
    }
    const instanceId = (instance as unknown as { _id: mongoose.Types.ObjectId })._id

    const saved = await subindicatorRepository.create({
      typeId: new mongoose.Types.ObjectId(body.typeId),
      indicatorInstanceId: instanceId,
      name: body.name,
      requireCover: body.requireCover ?? false,
      cover: body.cover,
      observationCover: body.observationCover,
      isPlanned: body.isPlanned,
      isDiagnosed: body.isDiagnosed,
      responsibleText: body.responsibleText ?? 'Administracion',
      responsibleUserIds: toObjectIds(body.responsibleUserIds),
      qualification: 0,
      score: 0,
      totalScore: 0,
      autoQualification: 0,
      state: true,
      created: now,
      lastUpdate: now,
      createdBy: user,
      commits: toObjectIds(body.commits),
      evidences: toObjectIds(body.evidences)
    } as unknown as Parameters<typeof subindicatorRepository.create>[0])

    // Enlazar a la IndicatorInstance v2.
    const savedId = (saved as unknown as { _id: mongoose.Types.ObjectId })._id
    await linkSubToInstance(instanceId, savedId)

    return created(res, saved)
  })
)

router.put(
  '/:id',
  authenticate,
  requirePermission('subindicator:create'),
  validate({ params: idParamSchema, body: updateBodySchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof updateBodySchema>
    const update: Record<string, unknown> = { lastUpdate: new Date() }

    if (body.name !== undefined) update.name = body.name
    if (body.responsibleText !== undefined) update.responsibleText = body.responsibleText
    if (body.responsibleUserIds !== undefined) {
      update.responsibleUserIds = toObjectIds(body.responsibleUserIds)
    }
    if (body.typeId !== undefined) {
      update.typeId = new mongoose.Types.ObjectId(body.typeId)
    }
    if (body.qualification !== undefined) update.qualification = body.qualification
    if (body.commits !== undefined) update.commits = toObjectIds(body.commits)
    if (body.evidences !== undefined) update.evidences = toObjectIds(body.evidences)

    const updated = await subindicatorRepository.updateById(req.params.id, update)
    if (!updated) {
      throw new NotFoundError('subindicator not found')
    }
    return ok(res, updated)
  })
)

router.delete(
  '/:id',
  authenticate,
  requirePermission('subindicator:create'),
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const deleted = await subindicatorRepository.deleteById(req.params.id)
    if (!deleted) {
      throw new NotFoundError('subindicator not found')
    }
    return noContent(res)
  })
)

export = router
