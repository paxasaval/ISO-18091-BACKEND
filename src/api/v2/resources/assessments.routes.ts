// Recurso REST /api/v2/assessments — lectura de CharacteristicAssessmentV2.
//
// La rubrica es POR caracteristica (no por evidencia). Este router permite
// consultar los assessments de un subindicador/caracteristica sin un recurso
// REST completo de CRUD (el assessment se crea/actualiza desde
// PUT /api/v2/evidences/:id/qualify).
//
// Endpoints:
//   GET /subindicators/:subindicatorId/assessments
//       -> lista de assessments del subindicador (todos sus pares caracteristica).
//   GET /subindicators/:subindicatorId/assessments/:characteristicId
//       -> assessment especifico del par (subindicatorId, characteristicId).
//
// Decision de diseno: se monta como router separado bajo /api/v2 para no
// tocar el recurso /subindicators (que sigue siendo legacy en Tema 5).
// Se monta en el index bajo '/subindicators' con path param :subindicatorId.

import { Router } from 'express'
import { z } from 'zod'
import mongoose from 'mongoose'
import { characteristicAssessmentRepository } from '../../../v2/repositories/characteristic-assessment.repository'
import { NotFoundError } from '../../../utils/errors'
import { asyncHandler } from '../async-handler'
import { ok } from '../envelope'
import { objectId } from '../schemas'
import { validate } from '../validate'

const router = Router({ mergeParams: true })

// --- Schemas ---

const subindicatorParamSchema = z.object({
  subindicatorId: objectId
})

const characteristicParamSchema = z.object({
  subindicatorId: objectId,
  characteristicId: objectId
})

// --- Rutas ---

// GET /subindicators/:subindicatorId/assessments
router.get(
  '/',
  validate({ params: subindicatorParamSchema }),
  asyncHandler(async (req, res) => {
    const { subindicatorId } = req.params as unknown as z.infer<
      typeof subindicatorParamSchema
    >
    const items = await characteristicAssessmentRepository.findAll({
      subindicatorId: new mongoose.Types.ObjectId(subindicatorId)
    }, {
      populate: [
        { path: 'qualifiedBy', select: 'name email' },
        { path: 'characteristicId', select: 'name group groupName' }
      ]
    })
    return ok(res, items)
  })
)

// GET /subindicators/:subindicatorId/assessments/:characteristicId
router.get(
  '/:characteristicId',
  validate({ params: characteristicParamSchema }),
  asyncHandler(async (req, res) => {
    const { subindicatorId, characteristicId } = req.params as unknown as z.infer<
      typeof characteristicParamSchema
    >
    const item = await characteristicAssessmentRepository.findOne({
      subindicatorId: new mongoose.Types.ObjectId(subindicatorId),
      characteristicId: new mongoose.Types.ObjectId(characteristicId)
    }, {
      populate: [
        { path: 'qualifiedBy', select: 'name email' },
        { path: 'characteristicId', select: 'name group groupName' }
      ]
    })
    if (!item) {
      throw new NotFoundError('assessment not found')
    }
    return ok(res, item)
  })
)

export = router
