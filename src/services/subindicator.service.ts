// Servicio de subindicador (Fase 3).
//
// Unifica updateSubindicator (lineas ~52-83) y updateSubindicator2
// (lineas ~212-237) de utils/middleware.js en UN solo metodo parametrizado.
//
// DIFERENCIA preservada entre ambos: updateSubindicator agrega la evidencia
// nueva al array de evidencias ANTES de calificar
//   (subindcatorBD.evidences = subindcatorBD.evidences.concat(evidence))
// mientras updateSubindicator2 NO lo hace (recalifica solo con las evidencias
// ya persistidas). El flag includeNewEvidence selecciona ese comportamiento:
//   - updateSubindicator   -> includeNewEvidence: true
//   - updateSubindicator2  -> includeNewEvidence: false
// El resto del flujo (gad/publishAuto, lastUpdate/By, persistencia y llamada a
// updateIndicator) es IDENTICO en ambas variantes.

import type { Request } from 'express'
import { subIndicatorRepository, gadRepository } from '../repositories'
import qualificationService from './qualification.service'

interface EvidenceInput {
  subIndicatorID: unknown
  author: unknown
}

interface RecalcOptions {
  includeNewEvidence: boolean
}

export class SubindicatorService {
  async recalcSubindicatorFromEvidence(
    evidence: EvidenceInput,
    req: Request,
    options: RecalcOptions
  ): Promise<unknown> {
    const subindicatorID = String(evidence.subIndicatorID)
    const subindcatorBD = await subIndicatorRepository.findByIdForQualification(
      subindicatorID
    )

    // typeID viene poblado con characteristics (ver findByIdForQualification).
    const populated = subindcatorBD as unknown as {
      id?: unknown
      evidences: unknown[]
      typeID: { characteristics: unknown[] }
      score: number
      totalScore: number
      qualification: number
      state?: boolean
      lastUpdate?: Date
      lastUpdateBy?: unknown
      indicadorID: unknown
    }
    const arrayCharacteristics = populated.typeID.characteristics

    // updateSubindicator agrega la nueva evidencia ANTES de calificar;
    // updateSubindicator2 no. Esa es la unica diferencia entre ambas.
    if (options.includeNewEvidence) {
      populated.evidences = populated.evidences.concat(evidence)
    }

    const subindcatorQualify = qualificationService.qualifySubindicator(
      // El tipo poblado dinamico se ajusta al contrato laxo del servicio de
      // calificacion (acceso a evidence.qualification / characteristic.score).
      populated as never,
      arrayCharacteristics as never
    ) as typeof populated

    const gadID = req.get('tenant') as string
    const gadBD = (await gadRepository.findById(gadID)) as unknown as {
      publishAuto: boolean
    }
    if (gadBD.publishAuto) {
      subindcatorQualify.state = true
    }
    subindcatorQualify.lastUpdate = new Date()
    // el ultimo que registro evidencia
    subindcatorQualify.lastUpdateBy = evidence.author
    const subindicatorUpdate = await subIndicatorRepository.updateById(
      String(subindcatorQualify.id),
      subindcatorQualify as Record<string, unknown>,
      { new: true }
    )
    // ahora actualizamos el indicador
    const indicatorUpdated = await qualificationService.updateIndicator(
      subindicatorUpdate as never,
      req
    )
    return indicatorUpdated
  }
}

export const subindicatorService = new SubindicatorService()
export default subindicatorService
