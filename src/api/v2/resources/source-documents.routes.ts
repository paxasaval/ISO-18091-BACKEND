// Recurso REST /api/v2/source-documents sobre la capa de datos v2
// (SourceDocumentV2, coleccion v2_source_documents).
//
// Biblioteca POA reutilizable a nivel GAD/periodo: el documento se sube UNA vez
// y se referencia desde multiples evidencias (EvidenceV2.sourceId).
//
// Endpoints:
//   GET    /               -> lista (?gad=&period=&year=, paginacion+meta)
//   GET    /:id            -> 200 | 404
//   POST   /               -> authenticate + requirePermission('evidence:upload'); 201
//   PUT    /:id            -> authenticate + requirePermission('evidence:upload'); 200 | 404
//   DELETE /:id            -> authenticate + requirePermission('evidence:upload'); 204 | 404
//   PATCH  /:id/verify     -> authenticate + requirePermission('evidence:publish');
//                            marca verified=true/false y propaga a evidencias que
//                            referencian esta fuente (salvo override por
//                            caracteristica — ver punto 4 del objetivo).
//
// Propagacion de verificacion:
//   Al PATCH /verify, todas las EvidenceV2 con sourceId===doc._id heredan
//   el valor de verified, SALVO las que tienen sourceOverride===true en el
//   CharacteristicAssessmentV2 correspondiente. El campo `sourceOverrides` en
//   CharacteristicAssessmentV2 (array de sourceDocumentId) actua como lista de
//   exclusion: si el sourceDoc esta en la lista del assessment, esa evidencia no
//   se propaga. Se registra un audit 'verified.propagate' por cada propagacion.

import { Router } from 'express'
import { z } from 'zod'
import mongoose from 'mongoose'
import { sourceDocumentRepository } from '../../../v2/repositories/source-document.repository'
import { evidenceRepository } from '../../../v2/repositories/evidence.repository'
import { characteristicAssessmentRepository } from '../../../v2/repositories/characteristic-assessment.repository'
import { NotFoundError, UnauthorizedError } from '../../../utils/errors'
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
  id: objectId
})

const listQuerySchema = paginationQuerySchema.extend({
  gad: objectId.optional(),
  period: objectId.optional(),
  year: z.string().optional()
})

const createBodySchema = z.object({
  gadId: objectId,
  periodId: objectId.optional(),
  year: z.string().optional(),
  name: z.string().min(1),
  link: z.string().min(1),
  kind: z.string().optional()
})

const updateBodySchema = z.object({
  name: z.string().min(1).optional(),
  link: z.string().min(1).optional(),
  kind: z.string().optional(),
  year: z.string().optional(),
  periodId: objectId.optional()
})

const verifyBodySchema = z.object({
  verified: z.boolean()
})

// --- Rutas ---

router.get(
  '/',
  validate({ query: listQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof listQuerySchema>
    const filter: Record<string, unknown> = {}
    if (query.gad) filter.gadId = new mongoose.Types.ObjectId(query.gad)
    if (query.period) filter.periodId = new mongoose.Types.ObjectId(query.period)
    if (query.year) filter.year = query.year

    const pg = resolvePagination(query)

    if (!pg.enabled) {
      const items = await sourceDocumentRepository.findAll(filter)
      return ok(res, items)
    }

    const { items, total } = await sourceDocumentRepository.findPage(
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
    const item = await sourceDocumentRepository.findById(req.params.id)
    if (!item) {
      throw new NotFoundError('source document not found')
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

    const item = await sourceDocumentRepository.create({
      gadId: new mongoose.Types.ObjectId(body.gadId),
      periodId: body.periodId ? new mongoose.Types.ObjectId(body.periodId) : undefined,
      year: body.year,
      name: body.name,
      link: body.link,
      kind: body.kind,
      uploadedBy: new mongoose.Types.ObjectId(userId),
      verified: false,
      createdAt: new Date()
    } as unknown as Parameters<typeof sourceDocumentRepository.create>[0])

    await auditService.record({
      actor: userId,
      action: 'sourcedocument.create',
      entityType: 'source_document',
      entityId: (item as unknown as { _id: { toString(): string } })._id.toString()
    })

    return created(res, item)
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
    if (body.kind !== undefined) update.kind = body.kind
    if (body.year !== undefined) update.year = body.year
    if (body.periodId !== undefined) {
      update.periodId = new mongoose.Types.ObjectId(body.periodId)
    }

    const updated = await sourceDocumentRepository.updateById(
      req.params.id,
      update
    )
    if (!updated) {
      throw new NotFoundError('source document not found')
    }

    await auditService.record({
      actor: req.token!.id,
      action: 'sourcedocument.update',
      entityType: 'source_document',
      entityId: req.params.id
    })

    return ok(res, updated)
  })
)

router.delete(
  '/:id',
  authenticate,
  requirePermission('evidence:upload'),
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const deleted = await sourceDocumentRepository.deleteById(req.params.id)
    if (!deleted) {
      throw new NotFoundError('source document not found')
    }

    await auditService.record({
      actor: req.token!.id,
      action: 'sourcedocument.delete',
      entityType: 'source_document',
      entityId: req.params.id
    })

    return noContent(res)
  })
)

// PATCH /:id/verify — publica/despublica la fuente y propaga a evidencias.
//
// Propagacion: busca todas las EvidenceV2 con sourceId===doc._id y aplica
// el nuevo valor de verified, SALVO las que tienen su characteristicId en la
// lista `sourceOverrides` del CharacteristicAssessmentV2 asociado.
//
// Override por caracteristica (modelado minimo):
//   CharacteristicAssessmentV2 tiene un campo opcional `sourceOverrides`
//   (array de ObjectId). Si el sourceDocumentId esta en esa lista para el
//   assessment de (subindicatorId, characteristicId) de la evidencia, no se
//   propaga la verificacion de esa fuente a esa evidencia.
//
//   TODO: exponer un endpoint para que el evaluador gestione `sourceOverrides`
//   (p.ej. PATCH /api/v2/subindicators/:id/assessments/:assessmentId/overrides).
router.patch(
  '/:id/verify',
  authenticate,
  requirePermission('evidence:publish'),
  validate({ params: idParamSchema, body: verifyBodySchema }),
  asyncHandler(async (req, res) => {
    const { verified } = req.body as z.infer<typeof verifyBodySchema>
    const userId = req.token!.id

    const doc = await sourceDocumentRepository.findById(req.params.id)
    if (!doc) {
      throw new NotFoundError('source document not found')
    }

    const updated = await sourceDocumentRepository.updateById(
      req.params.id,
      { verified } as unknown as Parameters<typeof sourceDocumentRepository.updateById>[1]
    )

    await auditService.record({
      actor: userId,
      action: 'sourcedocument.verify',
      entityType: 'source_document',
      entityId: req.params.id,
      meta: { verified }
    })

    // Propagar verified a las evidencias que referencian esta fuente,
    // salvo las que tienen un override de caracteristica activo.
    const docId = (doc as unknown as { _id: mongoose.Types.ObjectId })._id

    // Obtener todas las evidencias que referencian este source document.
    const linkedEvidences = await evidenceRepository.findAll({ sourceId: docId })

    for (const evidence of linkedEvidences) {
      const ev = evidence as unknown as {
        _id: mongoose.Types.ObjectId
        subindicatorId: mongoose.Types.ObjectId
        characteristicId: mongoose.Types.ObjectId
      }

      // Buscar si existe un assessment para (subindicatorId, characteristicId)
      // con override para este sourceDocument.
      const assessment = await characteristicAssessmentRepository.findOne({
        subindicatorId: ev.subindicatorId,
        characteristicId: ev.characteristicId
      })

      const assessmentDoc = assessment as unknown as {
        sourceOverrides?: mongoose.Types.ObjectId[]
      } | null

      // Si el assessment tiene un override para esta fuente, no propagar.
      const hasOverride = assessmentDoc?.sourceOverrides?.some(
        (overrideId) => overrideId.toString() === docId.toString()
      ) ?? false

      if (hasOverride) {
        continue
      }

      // Propagar el verified a la evidencia.
      await evidenceRepository.updateById(
        ev._id.toString(),
        { verified } as unknown as Parameters<typeof evidenceRepository.updateById>[1]
      )

      await auditService.record({
        actor: userId,
        action: 'verified.propagate',
        entityType: 'evidence',
        entityId: ev._id.toString(),
        meta: {
          sourceDocumentId: docId.toString(),
          verified
        }
      })
    }

    return ok(res, updated)
  })
)

export = router
