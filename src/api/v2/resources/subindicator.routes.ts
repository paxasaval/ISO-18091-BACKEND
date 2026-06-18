// Recurso REST /api/v2/subindicators sobre subIndicatorRepository, con auth v2.
//
// Endpoints:
//   GET    /                       -> lista. Filtros:
//                                       ?indicator=<id>  -> por indicadorID
//                                       ?type=general    -> aggregate de
//                                         subindicadores generales (mandatory)
//                                       ?type=specific   -> aggregate de
//                                         subindicadores especificos
//                                     paginacion ?page=&size= con meta.
//   GET    /:id                    -> 200 (populate profundo) | 404 NOT_FOUND
//   POST   /                       -> authenticate + requireElevatedRole; crea y
//                                     enlaza a la IndicatorInstance + notify. 201.
//   PUT    /:id                    -> 200 (reemplazo) | 404 NOT_FOUND
//   DELETE /:id                    -> 204 | 404 NOT_FOUND
//
// Decision REST: el filtrado por indicador se expone como ?indicator=<id> (en
// vez de una subruta anidada bajo /indicators) para mantener el recurso plano y
// reutilizar los metodos de repo (paginate + aggregates). Los aggregates
// general/specific se ofrecen via ?type= para no perder esa funcionalidad del
// dominio.

import mongoose from 'mongoose'
import { Router } from 'express'
import { z } from 'zod'
import subIndicatorRepository from '../../../repositories/subindicator.repository'
import { NotFoundError, UnauthorizedError, ValidationError } from '../../../utils/errors'
import notificationService from '../../../services/notification.service'
import { NotificationType, NotificationItemType } from '../../../constants'
import { asyncHandler } from '../async-handler'
import { authenticate, requireElevatedRole } from '../auth'
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
  indicator: objectId.optional(),
  type: z.enum(['general', 'specific']).optional()
})

const createBodySchema = z.object({
  indicadorID: objectId,
  typeID: objectId,
  name: z.string().min(1),
  responsible: z.string().optional(),
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
  name: z.string().min(1),
  responsible: z.string().optional(),
  typeID: objectId.optional(),
  qualification: z.number().optional(),
  commits: z.array(objectId).optional(),
  evidences: z.array(objectId).optional()
})

const toObjectIds = (ids?: string[]): mongoose.Types.ObjectId[] =>
  (ids ?? []).map((id) => new mongoose.Types.ObjectId(id))

// --- Rutas ---

router.get(
  '/',
  validate({ query: listQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof listQuerySchema>
    const pg = resolvePagination(query)
    const page = pg.page
    const size = pg.size
    const offset = (page - 1) * size

    // Aggregates por tipo requieren un indicador objetivo.
    if (query.type) {
      if (!query.indicator) {
        throw new ValidationError('indicator is required for type aggregates')
      }
      if (query.type === 'general') {
        const items = await subIndicatorRepository.aggregateGeneral(
          query.indicator
        )
        return ok(res, items)
      }
      // specific: el repo devuelve [{ totalCount, results }] via $facet.
      const data = (await subIndicatorRepository.aggregateSpecificPaginated(
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

    const filter = query.indicator ? { indicadorID: query.indicator } : {}

    if (!pg.enabled) {
      const items = await subIndicatorRepository.findAll(filter, {
        populate: [
          { path: 'evidences', model: 'Evidence' },
          { path: 'typeID', populate: { path: 'characteristics' } },
          { path: 'createdBy' }
        ]
      })
      return ok(res, items)
    }

    const { items, total } = await subIndicatorRepository.findPage(
      filter,
      page,
      size,
      {
        populate: [
          { path: 'evidences', model: 'Evidence' },
          { path: 'typeID', populate: { path: 'characteristics' } },
          { path: 'createdBy' }
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
    const item = await subIndicatorRepository.findByIdDeep(req.params.id)
    if (!item) {
      throw new NotFoundError('subindicator not found')
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
    const userId = req.token?.id
    if (!userId) {
      throw new UnauthorizedError('token missing or invalid')
    }
    const user = new mongoose.Types.ObjectId(userId)
    const now = new Date()
    const saved = await subIndicatorRepository.createAndLinkToIndicator({
      typeID: new mongoose.Types.ObjectId(body.typeID),
      indicadorID: new mongoose.Types.ObjectId(body.indicadorID),
      name: body.name,
      requireCover: body.requireCover ?? false,
      cover: body.cover,
      observationCover: body.observationCover,
      isPlanned: body.isPlanned,
      isDiagnosed: body.isDiagnosed,
      responsible: body.responsible ?? 'Administracion',
      qualification: body.qualification ?? 0,
      created: now,
      lastUpdate: now,
      state: false,
      createdBy: user,
      commits: toObjectIds(body.commits),
      evidences: toObjectIds(body.evidences)
    } as unknown as Parameters<
      typeof subIndicatorRepository.createAndLinkToIndicator
    >[0])
    // notify recibe el req real (lo usan otras rutas del modulo de dominio).
    await notificationService.notify(
      NotificationType.Added,
      user,
      NotificationItemType.Subindicator,
      String(saved.id),
      req
    )
    return created(res, saved)
  })
)

router.put(
  '/:id',
  validate({ params: idParamSchema, body: updateBodySchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof updateBodySchema>
    const update: Record<string, unknown> = {
      name: body.name,
      lastUpdate: new Date()
    }
    if (body.responsible !== undefined) update.responsible = body.responsible
    if (body.typeID !== undefined) update.typeID = body.typeID
    if (body.qualification !== undefined) {
      update.qualification = body.qualification
    }
    if (body.commits !== undefined) update.commits = toObjectIds(body.commits)
    if (body.evidences !== undefined) {
      update.evidences = toObjectIds(body.evidences)
    }
    const updated = await subIndicatorRepository.updateById(
      req.params.id,
      update
    )
    if (!updated) {
      throw new NotFoundError('subindicator not found')
    }
    return ok(res, updated)
  })
)

router.delete(
  '/:id',
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const deleted = await subIndicatorRepository.deleteById(req.params.id)
    if (!deleted) {
      throw new NotFoundError('subindicator not found')
    }
    return noContent(res)
  })
)

export = router
