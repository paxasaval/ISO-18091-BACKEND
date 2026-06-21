// Recurso REST /api/v2/evidences re-apuntado a la capa v2 (EvidenceV2 /
// v2_evidences). Reemplaza el routeador legacy que usaba evidenceRepository v1.
//
// Endpoints:
//   GET    /                  -> lista (?subindicator=&characteristic=, paginacion)
//   GET    /:id               -> 200 (populate autor) | 404
//   POST   /                  -> authenticate + requirePermission('evidence:upload')
//                               author SIEMPRE desde req.token.id (no del body)
//                               Acepta kind ('principal'|'complementaria'),
//                               sourceId? y pages?. Valida con zod. 201.
//                               Audit evidence.create.
//                               NO recalcula score (TODO Tema 4).
//   PUT    /:id               -> authenticate + requirePermission('evidence:upload')
//                               edita metadatos. 200 | 404.
//   DELETE /:id               -> authenticate + requirePermission('evidence:qualify')
//                               204 | 404. Audit evidence.delete.
//                               NO recalcula score (TODO Tema 4).
//   PUT    /:id/qualify       -> authenticate + requirePermission('evidence:qualify')
//                               Crea/actualiza CharacteristicAssessmentV2 para
//                               {subindicatorId, characteristicId}.
//                               Segregacion: 403 si req.token.id === evidence.author.
//                               qualifiedBy = req.token.id.
//                               Audit evidence.qualify.
//                               NO calcula 0-3 del subindicador (TODO Tema 4).
//   PATCH  /:id/publish       -> authenticate + requirePermission('evidence:publish')
//                               set verified. Audit evidence.publish.
//
// TODO Tema 4: scoring.service consumira los CharacteristicAssessmentV2 para
// recalcular qualification 0-3 del subindicador e indicadorInstance.

import mongoose from 'mongoose'
import { Router } from 'express'
import { z } from 'zod'
import { evidenceRepository } from '../../../v2/repositories/evidence.repository'
import { characteristicAssessmentRepository } from '../../../v2/repositories/characteristic-assessment.repository'
import { ForbiddenError, NotFoundError, UnauthorizedError, ValidationError } from '../../../utils/errors'
import { authenticate, requirePermission } from '../auth'
import { asyncHandler } from '../async-handler'
import { buildPaginationMeta, created, noContent, ok } from '../envelope'
import { paginationQuerySchema, resolvePagination } from '../pagination'
import { objectId } from '../schemas'
import { validate } from '../validate'
import auditService from '../../../v2/services/audit.service'
import scoringService from '../../../v2/services/scoring.service'
import CharacteristicV2 from '../../../v2/models/characteristic.model'
import ValuationV2 from '../../../v2/models/valuation.model'

const router = Router()

// --- Schemas ---

const idParamSchema = z.object({
  id: objectId
})

const listQuerySchema = paginationQuerySchema.extend({
  subindicator: objectId.optional(),
  characteristic: objectId.optional()
})

const createBodySchema = z.object({
  characteristicId: objectId,
  subindicatorId: objectId,
  name: z.string().min(1),
  // link puede omitirse si sourceId esta presente
  link: z.string().optional(),
  note: z.string().optional(),
  kind: z.enum(['principal', 'complementaria']).optional(),
  sourceId: objectId.optional(),
  pages: z.string().optional(),
  extras: z.unknown().optional()
}).superRefine((val, ctx) => {
  if (!val.link && !val.sourceId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'link is required when sourceId is not provided',
      path: ['link']
    })
  }
})

const updateBodySchema = z.object({
  name: z.string().min(1).optional(),
  link: z.string().optional(),
  note: z.string().optional(),
  kind: z.enum(['principal', 'complementaria']).optional(),
  pages: z.string().optional()
})

// B2: weight se ignora del body; se carga de ValuationV2.maxValue en el handler.
const qualifyBodySchema = z.object({
  criteria: z.array(
    z.object({
      valuationId: objectId,
      met: z.boolean(),
      weight: z.number().optional()  // se acepta pero se descarta; el peso viene de ValuationV2
    })
  ).min(0)
})

const publishBodySchema = z.object({
  verified: z.boolean()
})

// --- Rutas ---

router.get(
  '/',
  validate({ query: listQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof listQuerySchema>
    const filter: Record<string, unknown> = {}
    if (query.subindicator) {
      filter.subindicatorId = new mongoose.Types.ObjectId(query.subindicator)
    }
    if (query.characteristic) {
      filter.characteristicId = new mongoose.Types.ObjectId(query.characteristic)
    }
    const pg = resolvePagination(query)

    if (!pg.enabled) {
      const items = await evidenceRepository.findAll(filter, {
        populate: { path: 'author', select: 'name email' }
      })
      return ok(res, items)
    }

    const { items, total } = await evidenceRepository.findPage(
      filter,
      pg.page,
      pg.size,
      { populate: { path: 'author', select: 'name email' } }
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
    const item = await evidenceRepository.findById(req.params.id, {
      populate: [
        { path: 'author', select: 'name email' },
        { path: 'sourceId' }
      ]
    })
    if (!item) {
      throw new NotFoundError('evidence not found')
    }
    return ok(res, item)
  })
)

router.post(
  '/',
  authenticate,
  requirePermission('evidence:upload'),
  validate({ body: createBodySchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof createBodySchema>
    const userId = req.token?.id
    if (!userId) {
      throw new UnauthorizedError('token missing or invalid')
    }

    const data: Record<string, unknown> = {
      characteristicId: new mongoose.Types.ObjectId(body.characteristicId),
      subindicatorId: new mongoose.Types.ObjectId(body.subindicatorId),
      name: body.name,
      note: body.note,
      kind: body.kind ?? 'principal',
      verified: false,
      // author SIEMPRE desde el token — no del body
      author: new mongoose.Types.ObjectId(userId),
      commits: [],
      extras: body.extras ?? {}
    }
    if (body.link) data.link = body.link
    if (body.sourceId) {
      data.sourceId = new mongoose.Types.ObjectId(body.sourceId)
    }
    if (body.pages) data.pages = body.pages

    const saved = await evidenceRepository.create(
      data as Parameters<typeof evidenceRepository.create>[0]
    )

    await auditService.record({
      actor: userId,
      action: 'evidence.create',
      entityType: 'evidence',
      entityId: (saved as unknown as { _id: { toString(): string } })._id.toString()
    })

    return created(res, saved)
  })
)

router.put(
  '/:id',
  authenticate,
  requirePermission('evidence:upload'),
  validate({ params: idParamSchema, body: updateBodySchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof updateBodySchema>
    const update: Record<string, unknown> = {}
    if (body.name !== undefined) update.name = body.name
    if (body.link !== undefined) update.link = body.link
    if (body.note !== undefined) update.note = body.note
    if (body.kind !== undefined) update.kind = body.kind
    if (body.pages !== undefined) update.pages = body.pages

    if (Object.keys(update).length === 0) {
      throw new ValidationError('no fields to update')
    }

    const updated = await evidenceRepository.updateById(req.params.id, update)
    if (!updated) {
      throw new NotFoundError('evidence not found')
    }

    await auditService.record({
      actor: req.token!.id,
      action: 'evidence.update',
      entityType: 'evidence',
      entityId: req.params.id
    })

    return ok(res, updated)
  })
)

router.delete(
  '/:id',
  authenticate,
  requirePermission('evidence:qualify'),
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const userId = req.token?.id
    if (!userId) {
      throw new UnauthorizedError('token missing or invalid')
    }

    const deleted = await evidenceRepository.deleteById(req.params.id)
    if (!deleted) {
      throw new NotFoundError('evidence not found')
    }

    const deletedDoc = deleted as unknown as {
      subindicatorId?: { toString(): string }
      characteristicId?: { toString(): string }
    }
    const deletedSub = deletedDoc.subindicatorId
    const deletedCh = deletedDoc.characteristicId

    await auditService.record({
      actor: userId,
      action: 'evidence.delete',
      entityType: 'evidence',
      entityId: req.params.id
    })

    if (deletedSub && deletedCh) {
      // B1: sincronizar verified del assessment antes del recompute.
      await scoringService.syncAssessmentVerified(
        deletedSub.toString(),
        deletedCh.toString()
      )
    }
    if (deletedSub) {
      await scoringService.recomputeAfterEvidenceChange(deletedSub.toString(), userId)
    }

    return noContent(res)
  })
)

// PUT /:id/qualify — Rubrica POR CARACTERISTICA.
//
// Crea o actualiza un CharacteristicAssessmentV2 para el par
// (subindicatorId, characteristicId) de la evidencia con los criterios
// enviados. El campo qualifiedBy se toma del token (no del body).
//
// Segregacion de funciones: si req.token.id === evidence.author, devuelve 403.
// Esto implementa la separacion entre quien sube y quien califica (Tema 3/5).
//
// NO calcula el 0-3 del subindicador (TODO Tema 4).
router.put(
  '/:id/qualify',
  authenticate,
  requirePermission('evidence:qualify'),
  validate({ params: idParamSchema, body: qualifyBodySchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof qualifyBodySchema>
    const userId = req.token?.id
    if (!userId) {
      throw new UnauthorizedError('token missing or invalid')
    }

    const evidence = await evidenceRepository.findById(req.params.id)
    if (!evidence) {
      throw new NotFoundError('evidence not found')
    }

    const ev = evidence as unknown as {
      author: mongoose.Types.ObjectId
      subindicatorId: mongoose.Types.ObjectId
      characteristicId: mongoose.Types.ObjectId
    }

    // Segregacion: quien sube no puede calificar.
    if (ev.author.toString() === userId) {
      throw new ForbiddenError(
        'the evidence author cannot qualify their own evidence'
      )
    }

    // M5: validar que cada valuationId pertenece a las valuaciones de la caracteristica.
    const characteristic = await CharacteristicV2.findById(ev.characteristicId).exec()
    if (!characteristic) {
      throw new NotFoundError('characteristic not found')
    }
    const chDoc = characteristic as unknown as { valuations: mongoose.Types.ObjectId[] }
    const allowedValuationIds = new Set(
      (chDoc.valuations ?? []).map((vid) => vid.toString())
    )
    for (const c of body.criteria) {
      if (!allowedValuationIds.has(c.valuationId)) {
        throw new ValidationError(
          `valuationId ${c.valuationId} does not belong to characteristic ${ev.characteristicId.toString()}`
        )
      }
    }

    // B2: cargar el peso real desde ValuationV2.maxValue; ignorar weight del body.
    const valuationDocs = await ValuationV2.find({
      _id: { $in: body.criteria.map((c) => new mongoose.Types.ObjectId(c.valuationId)) }
    }).exec()
    const weightByValuationId = new Map(
      (valuationDocs as unknown as Array<{ _id: mongoose.Types.ObjectId; maxValue: number }>)
        .map((v) => [v._id.toString(), v.maxValue])
    )

    const criteria = body.criteria.map((c) => ({
      valuationId: new mongoose.Types.ObjectId(c.valuationId),
      met: c.met,
      // B2: peso desde la base de datos, no del cliente.
      weight: weightByValuationId.get(c.valuationId) ?? 0
    }))

    // Calcular score como suma de weights de criterios cumplidos.
    // totalRubric = suma de todos los weights (desde ValuationV2.maxValue).
    const score = criteria.reduce(
      (acc, c) => acc + (c.met ? c.weight : 0),
      0
    )
    const totalRubric = criteria.reduce((acc, c) => acc + c.weight, 0)

    // Buscar assessment existente para el par (subindicatorId, characteristicId).
    const existing = await characteristicAssessmentRepository.findOne({
      subindicatorId: ev.subindicatorId,
      characteristicId: ev.characteristicId
    })

    let assessment
    if (existing) {
      const existingDoc = existing as unknown as { _id: { toString(): string } }
      assessment = await characteristicAssessmentRepository.updateById(
        existingDoc._id.toString(),
        {
          criteria,
          score,
          totalRubric,
          qualifiedBy: new mongoose.Types.ObjectId(userId),
          qualifiedAt: new Date()
        } as unknown as Parameters<typeof characteristicAssessmentRepository.updateById>[1]
      )
    } else {
      assessment = await characteristicAssessmentRepository.create({
        subindicatorId: ev.subindicatorId,
        characteristicId: ev.characteristicId,
        criteria,
        score,
        totalRubric,
        verified: false,
        qualifiedBy: new mongoose.Types.ObjectId(userId),
        qualifiedAt: new Date(),
        sourceOverrides: []
      } as unknown as Parameters<typeof characteristicAssessmentRepository.create>[0])
    }

    await auditService.record({
      actor: userId,
      action: 'evidence.qualify',
      entityType: 'evidence',
      entityId: req.params.id,
      meta: {
        subindicatorId: ev.subindicatorId.toString(),
        characteristicId: ev.characteristicId.toString(),
        score,
        totalRubric
      }
    })

    // B1: sincronizar verified del assessment antes del recompute.
    // qualify no cambia el verified de la evidencia; la sincronizacion asegura
    // que el assessment refleja el estado actual de las evidencias verificadas.
    await scoringService.syncAssessmentVerified(
      ev.subindicatorId.toString(),
      ev.characteristicId.toString()
    )
    await scoringService.recomputeAfterEvidenceChange(ev.subindicatorId.toString(), userId)

    return ok(res, { evidence, assessment })
  })
)

// PATCH /:id/publish — publica/despublica una evidencia (set verified).
router.patch(
  '/:id/publish',
  authenticate,
  requirePermission('evidence:publish'),
  validate({ params: idParamSchema, body: publishBodySchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof publishBodySchema>
    const userId = req.token?.id
    if (!userId) {
      throw new UnauthorizedError('token missing or invalid')
    }

    const updated = await evidenceRepository.updateById(
      req.params.id,
      { verified: body.verified } as unknown as Parameters<typeof evidenceRepository.updateById>[1]
    )
    if (!updated) {
      throw new NotFoundError('evidence not found')
    }

    await auditService.record({
      actor: userId,
      action: 'evidence.publish',
      entityType: 'evidence',
      entityId: req.params.id,
      meta: { verified: body.verified }
    })

    const updatedDoc = updated as unknown as {
      subindicatorId?: { toString(): string }
      characteristicId?: { toString(): string }
    }
    const updatedSub = updatedDoc.subindicatorId
    const updatedCh = updatedDoc.characteristicId

    if (updatedSub && updatedCh) {
      // B1: sincronizar verified del assessment tras cambiar verified de la evidencia.
      await scoringService.syncAssessmentVerified(
        updatedSub.toString(),
        updatedCh.toString()
      )
    }
    if (updatedSub) {
      await scoringService.recomputeAfterEvidenceChange(updatedSub.toString(), userId)
    }

    return ok(res, updated)
  })
)

export = router
