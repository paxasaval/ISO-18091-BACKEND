// Recurso REST /api/v2/evidences sobre evidenceRepository, con auth v2.
//
// Endpoints:
//   GET    /                 -> lista (?subindicator=<id> filtra; paginacion)
//   GET    /:id              -> 200 (populate profundo) | 404 NOT_FOUND
//   POST   /                 -> authenticate + requireElevatedRole (rol != USER);
//                              crea + notify(1,..,3,..) +
//                              recalcSubindicatorFromEvidence({includeNewEvidence:
//                              true}). 201.
//   PUT    /:id/qualify      -> authenticate + requireAdminRole (rol ADMIN);
//                              crea/actualiza rubricas, califica + notify(2,..,3,..)
//                              + recalc({includeNewEvidence:false}). 200 | 404.
//   PUT    /:id              -> 200 (reemplazo de campos editables) | 404
//   DELETE /:id              -> authenticate + requireAdminRole; elimina y
//                              re-califica subindicador (autoQualify) e indicador
//                              (autoQualification) persistiendo, como el legacy.
//                              204 | 404.
//
// Toda la logica de negocio (recalc/notify/autoQualify) se delega a los servicios
// existentes, pasandoles el req real (recalc/notify usan req.get('tenant')).

import mongoose from 'mongoose'
import { Router } from 'express'
import { z } from 'zod'
import evidenceRepository from '../../../repositories/evidence.repository'
import subIndicatorRepository from '../../../repositories/subindicator.repository'
import indicatorInstanceRepository from '../../../repositories/indicatorInstance.repository'
import notificationService from '../../../services/notification.service'
import subindicatorService from '../../../services/subindicator.service'
import qualificationService from '../../../services/qualification.service'
import { NotificationType, NotificationItemType } from '../../../constants'
import { NotFoundError, UnauthorizedError } from '../../../utils/errors'
import Rubric from '../../../../models/rubric'
import Commit from '../../../../models/commit'
import { asyncHandler } from '../async-handler'
import { authenticate, requireElevatedRole } from '../auth'
import { requireAdminRole } from '../require-admin'
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
  subindicator: objectId.optional()
})

const createBodySchema = z.object({
  characteristicID: objectId,
  subIndicatorID: objectId,
  name: z.string().min(1),
  link: z.string().optional(),
  note: z.string().optional(),
  content: z.array(z.unknown()).optional(),
  verified: z.boolean().optional(),
  qualification: z.number().optional(),
  extras: z.unknown().optional()
})

const qualifyBodySchema = z.object({
  qualification: z.number(),
  user: objectId.optional(),
  verified: z.boolean().optional(),
  commit: z.string().optional(),
  rubric: z
    .array(
      z.object({
        valuation: objectId,
        qualification: z.number()
      })
    )
    .optional()
})

const updateBodySchema = z.object({
  name: z.string().min(1),
  characteristicID: objectId,
  subIndicatorID: objectId,
  link: z.string().optional(),
  verified: z.boolean().optional(),
  note: z.string().optional()
})

// --- Rutas ---

router.get(
  '/',
  validate({ query: listQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof listQuerySchema>
    const filter = query.subindicator
      ? { subIndicatorID: query.subindicator }
      : {}
    const pg = resolvePagination(query)

    if (!pg.enabled) {
      const items = await evidenceRepository.findAll(filter)
      return ok(res, items)
    }

    const { items, total } = await evidenceRepository.findPage(
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
    const item = await evidenceRepository.findByIdDeep(req.params.id)
    if (!item) {
      throw new NotFoundError('evidence not found')
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
    const saved = await evidenceRepository.create({
      characteristicID: new mongoose.Types.ObjectId(body.characteristicID),
      subIndicatorID: new mongoose.Types.ObjectId(body.subIndicatorID),
      name: body.name,
      link: body.link,
      note: body.note,
      content: body.content ?? [],
      state: true,
      verified: body.verified ?? false,
      qualification: body.qualification ?? 1,
      author: new mongoose.Types.ObjectId(userId),
      commits: [],
      ...(body.extras ? { extras: body.extras } : {})
    } as unknown as Parameters<typeof evidenceRepository.create>[0])

    await notificationService.notify(
      NotificationType.Added,
      userId,
      NotificationItemType.Evidence,
      String(saved.id),
      req
    )
    // recalc usa req.get('tenant'); le pasamos el req real del handler.
    await subindicatorService.recalcSubindicatorFromEvidence(
      saved as unknown as { subIndicatorID: unknown; author: unknown },
      req,
      { includeNewEvidence: true }
    )
    return created(res, saved)
  })
)

router.put(
  '/:id/qualify',
  authenticate,
  requireAdminRole,
  validate({ params: idParamSchema, body: qualifyBodySchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof qualifyBodySchema>
    const userId = req.token?.id
    if (!userId) {
      throw new UnauthorizedError('token missing or invalid')
    }
    const id = req.params.id
    const evidenceCurrent = (await evidenceRepository.findById(id)) as unknown as {
      _id: unknown
      rubric: unknown[]
      qualification: unknown
      qualificationBy: unknown
      verified: unknown
      qualificationDate: Date
      commits: unknown[]
    } | null
    if (!evidenceCurrent) {
      throw new NotFoundError('evidence not found')
    }

    let rubric: unknown
    const incomingRubric = body.rubric ?? []
    if (evidenceCurrent.rubric.length === 0) {
      rubric = await Promise.all(
        incomingRubric.map(async (r) => {
          const newRubric = new Rubric({
            valuation: new mongoose.Types.ObjectId(r.valuation),
            qualification: r.qualification,
            evidence: evidenceCurrent._id
          })
          const rSave = await newRubric.save()
          return rSave._id
        })
      )
    } else {
      for (const i of incomingRubric) {
        const rubricDB = (await Rubric.findOne({
          valuation: i.valuation,
          evidence: evidenceCurrent._id
        })) as unknown as { _id: unknown } | null
        if (rubricDB) {
          await Rubric.findByIdAndUpdate(
            rubricDB._id as string,
            { qualification: i.qualification },
            { new: true }
          )
        }
      }
      rubric = evidenceCurrent.rubric
    }

    evidenceCurrent.rubric = rubric as unknown[]
    evidenceCurrent.qualification = body.qualification
    evidenceCurrent.qualificationBy = body.user
    evidenceCurrent.verified = body.verified ?? false
    evidenceCurrent.qualificationDate = new Date()
    if (body.commit) {
      const commit = new Commit({
        autor: userId,
        body: body.commit,
        created: new Date(),
        lastUpdate: new Date()
      })
      const commitSave = await commit.save()
      evidenceCurrent.commits = evidenceCurrent.commits.concat(commitSave._id)
    }

    const updated = (await evidenceRepository.updateById(
      id,
      evidenceCurrent as Record<string, unknown>,
      { new: true }
    )) as unknown as { id: unknown; subIndicatorID: unknown }

    await notificationService.notify(
      NotificationType.Modified,
      userId,
      NotificationItemType.Evidence,
      String(updated.id),
      req
    )
    await subindicatorService.recalcSubindicatorFromEvidence(
      updated as unknown as { subIndicatorID: unknown; author: unknown },
      req,
      { includeNewEvidence: false }
    )
    await subIndicatorRepository.updateById(
      String(updated.subIndicatorID),
      { lastUpdate: new Date() },
      { new: true }
    )
    return ok(res, updated)
  })
)

router.put(
  '/:id',
  validate({ params: idParamSchema, body: updateBodySchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof updateBodySchema>
    const updated = await evidenceRepository.updateById(req.params.id, {
      name: body.name,
      characteristicID: body.characteristicID,
      subIndicatorID: body.subIndicatorID,
      link: body.link,
      verified: body.verified ?? false,
      note: body.note,
      commits: []
    })
    if (!updated) {
      throw new NotFoundError('evidence not found')
    }
    return ok(res, updated)
  })
)

router.delete(
  '/:id',
  authenticate,
  requireAdminRole,
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const userId = req.token?.id
    if (!userId) {
      throw new UnauthorizedError('token missing or invalid')
    }
    const deleted = (await evidenceRepository.deleteById(
      req.params.id
    )) as unknown as { subIndicatorID: unknown } | null
    if (!deleted) {
      throw new NotFoundError('evidence not found')
    }

    // Re-califica el subindicador (autoQualify) y persiste, como el legacy.
    const subindicatorBD = await subIndicatorRepository.findByIdForQualification(
      String(deleted.subIndicatorID)
    )
    const subindicatorUpdated = qualificationService.autoQualifySubindicator(
      subindicatorBD as never
    ) as unknown as {
      id: unknown
      indicadorID: unknown
      lastUpdate: Date
      lastUpdateBy: unknown
    }
    subindicatorUpdated.lastUpdate = new Date()
    subindicatorUpdated.lastUpdateBy = userId
    await subIndicatorRepository.updateById(
      String(subindicatorUpdated.id),
      subindicatorUpdated as Record<string, unknown>,
      { new: true }
    )

    // Re-califica el indicador (autoQualification) y persiste.
    const indicatorBD = await indicatorInstanceRepository.findById(
      String(subindicatorUpdated.indicadorID),
      { populate: { path: 'subindicators' } }
    )
    const indicatorUpdated = qualificationService.autoQualificationIndicator(
      indicatorBD as never
    ) as unknown as { id: unknown; lastUpdate: Date; lastUpdateBy: unknown }
    indicatorUpdated.lastUpdate = new Date()
    indicatorUpdated.lastUpdateBy = userId
    await indicatorInstanceRepository.updateById(
      String(indicatorUpdated.id),
      indicatorUpdated as Record<string, unknown>,
      { new: true }
    )

    return noContent(res)
  })
)

export = router
