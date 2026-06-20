// ===========================================================================
// Scoring Service v2 — fuente unica del algoritmo de calificacion ISO 18091.
// ===========================================================================
//
// FORMULA (documentada una sola vez aqui):
//
// 1. CARACTERISTICA — CharacteristicAssessmentV2
//    - Solo cuentan los assessments con `verified === true`.
//    - Peso de cada criterio = `criterion.weight` (almacenado desde Valuation.maxValue).
//    - score      = Σ weight de criterios con met===true
//    - totalRubric = Σ weight de todos los criterios del assessment
//    - percent    = score / totalRubric (0..1); 0 si totalRubric===0.
//
// 2. SUBINDICADOR — SubindicadorV2
//    - Se toman TODOS los CharacteristicAssessmentV2 verificados del subindicador.
//    - Para cada caracteristica: se calcula su percent (score/totalRubric).
//    - Agregacion de subindicador:
//        score     = Σ percent de caracteristicas verificadas
//        totalScore = numero de caracteristicas verificadas
//        percent   = score / totalScore ; 0 si totalScore===0.
//    - Criterio CRITICO (tier > 1):
//        si alguna caracteristica critica NO tiene assessment verificado (o su
//        percent === 0), el subindicador queda TAPEADO A ROJO (qualification=1)
//        independientemente del resto.
//    - Mapeo percent → qualification 0–3 (umbrales de semaforo del Type.red/yellow/green):
//        0         → qualification = 0  (sin evaluar: ningun assessment verificado)
//        [0, red)  → qualification = 1  (inaceptable / rojo)
//        [red, yellow) → qualification = 2  (debajo de lo aceptable / amarillo)
//        [yellow, ∞)   → qualification = 3  (aceptable / verde)
//        Si no hay umbrales en el Type, se usan defaults: red=0.50, yellow=0.75.
//        Los umbrales son fracciones de 0 a 1; se parsean con parseFloat.
//    - NO se calcula maturityLevel (reservado, Anexo A futuro).
//
// 3. INDICATOR INSTANCE — IndicatorInstanceV2
//    - Agrega la qualification de TODOS sus SubindicadorV2.
//    - Regla: toma el minimo de los qualifications. Si algun subindicador es 0
//      (sin evaluar), no arrastra al indicador a 0 (se ignoran los 0).
//      El indicador queda en 0 solo si todos sus subindicadores son 0.
//    - Si hay al menos un subindicador con qualification > 0, el indicador
//      refleja el minimo de los qualifications > 0.
//    - Esto reproduce la intencion del legacy updateIndicator sin los console.log
//      y con logica unificada.
//
// Funciones publicas:
//   recomputeSubindicator(subindicatorId: string): Promise<void>
//   recomputeIndicatorInstance(indicatorInstanceId: string): Promise<void>
//   recomputeAfterEvidenceChange(subindicatorId: string): Promise<void>
//     — llama a recomputeSubindicator y luego a recomputeIndicatorInstance del
//       IndicatorInstanceV2 padre. Para usar en qualify/publish/delete.
//
// Ambas son idempotentes: se pueden llamar multiples veces con el mismo resultado.
// ===========================================================================

import mongoose from 'mongoose'
import { characteristicAssessmentRepository } from '../repositories/characteristic-assessment.repository'
import { subindicatorRepository } from '../repositories/subindicator.repository'
import { indicatorInstanceRepository } from '../repositories/indicator-instance.repository'
import TypeModel from '../models/type.model'
import logger from '../../utils/logger'
import auditService from './audit.service'

// ---------------------------------------------------------------------------
// Tipos internos
// ---------------------------------------------------------------------------

interface AssessmentLean {
  _id: mongoose.Types.ObjectId
  subindicatorId: mongoose.Types.ObjectId
  characteristicId: mongoose.Types.ObjectId
  criteria: Array<{ met: boolean; weight: number }>
  score?: number
  totalRubric?: number
  verified: boolean
}

interface SubindicatorLean {
  _id: mongoose.Types.ObjectId
  typeId: mongoose.Types.ObjectId
  indicatorInstanceId: mongoose.Types.ObjectId
  qualification: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Parsea un threshold guardado como string (p.ej "0.50") o number.
// Devuelve el valor numerico; NaN si no es un numero valido.
const parseThreshold = (v: unknown): number => {
  if (v === undefined || v === null) return NaN
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return Number.isFinite(n) ? n : NaN
}

// Mapea un percent (0..1) a 0–3 segun umbrales.
// red y yellow son fracciones; si no son validos, se usan defaults.
const percentToQualification = (
  percent: number,
  redRaw: unknown,
  yellowRaw: unknown
): number => {
  const DEFAULT_RED = 0.5
  const DEFAULT_YELLOW = 0.75

  const red = Number.isFinite(parseThreshold(redRaw))
    ? parseThreshold(redRaw)
    : DEFAULT_RED
  const yellow = Number.isFinite(parseThreshold(yellowRaw))
    ? parseThreshold(yellowRaw)
    : DEFAULT_YELLOW

  if (percent < red) return 1
  if (percent < yellow) return 2
  return 3
}

// ---------------------------------------------------------------------------
// recomputeSubindicator
// ---------------------------------------------------------------------------

/**
 * Recalcula qualification, score y totalScore del SubindicadorV2.
 * Solo cuentan los CharacteristicAssessmentV2 con verified===true.
 * Persiste en v2_subindicators.
 * Idempotente.
 */
export const recomputeSubindicator = async (subindicatorId: string): Promise<void> => {
  // 1. Cargar subindicador y su Type (para umbrales y caracteristicas criticas).
  const sub = (await subindicatorRepository.findById(subindicatorId)) as unknown as SubindicatorLean | null
  if (!sub) {
    logger.info(`scoring.recomputeSubindicator: subindicador ${subindicatorId} no encontrado`)
    return
  }

  // Cargar Type con characteristics pobladas para saber tier.
  const type = await TypeModel.findById(sub.typeId).populate('characteristics').exec()
  if (!type) {
    logger.info(`scoring.recomputeSubindicator: Type ${sub.typeId} no encontrado para sub ${subindicatorId}`)
    return
  }

  const typeDoc = type as unknown as {
    red: unknown
    yellow: unknown
    characteristics: Array<{ _id: mongoose.Types.ObjectId; tier: number }>
  }

  // 2. Cargar assessments verificados del subindicador.
  const allAssessments = (await characteristicAssessmentRepository.findAll({
    subindicatorId: new mongoose.Types.ObjectId(subindicatorId)
  })) as unknown as AssessmentLean[]

  const verifiedAssessments = allAssessments.filter((a) => a.verified === true)

  // 3. Sin assessments verificados → sin evaluar (0).
  if (verifiedAssessments.length === 0) {
    await subindicatorRepository.updateById(subindicatorId, {
      qualification: 0,
      score: 0,
      totalScore: 0,
      autoQualification: 0,
      lastUpdate: new Date()
    })
    return
  }

  // 4. Calcular percent por assessment verificado.
  let aggregatedScore = 0
  let aggregatedTotal = 0

  for (const assessment of verifiedAssessments) {
    const totalRubric = assessment.criteria.reduce((sum, c) => sum + c.weight, 0)
    const score = assessment.criteria.reduce(
      (sum, c) => sum + (c.met ? c.weight : 0),
      0
    )
    const percent = totalRubric > 0 ? score / totalRubric : 0
    aggregatedScore += percent
    aggregatedTotal += 1
  }

  const overallPercent = aggregatedTotal > 0 ? aggregatedScore / aggregatedTotal : 0

  // 5. Verificar si hay caracteristicas criticas (tier > 1) no cubiertas.
  const characteristics = typeDoc.characteristics ?? []
  let criticalBlocked = false

  for (const ch of characteristics) {
    if (ch.tier <= 1) continue
    // Caracteristica critica: debe tener assessment verificado con percent > 0.
    const critAssessment = verifiedAssessments.find(
      (a) => a.characteristicId.toString() === ch._id.toString()
    )
    if (!critAssessment) {
      criticalBlocked = true
      break
    }
    const totalRubric = critAssessment.criteria.reduce((s, c) => s + c.weight, 0)
    const score = critAssessment.criteria.reduce(
      (s, c) => s + (c.met ? c.weight : 0),
      0
    )
    const percent = totalRubric > 0 ? score / totalRubric : 0
    if (percent === 0) {
      criticalBlocked = true
      break
    }
  }

  // 6. Mapear a 0–3.
  let qualification: number

  if (criticalBlocked) {
    // Caracteristica critica no cubierta → topa a rojo (1).
    qualification = 1
  } else {
    qualification = percentToQualification(overallPercent, typeDoc.red, typeDoc.yellow)
  }

  // score y totalScore almacenados como valores intermedios utiles.
  await subindicatorRepository.updateById(subindicatorId, {
    qualification,
    score: aggregatedScore,
    totalScore: aggregatedTotal,
    autoQualification: qualification,
    lastUpdate: new Date()
  })

  logger.info(
    `scoring.recomputeSubindicator: sub=${subindicatorId} ` +
    `percent=${overallPercent.toFixed(3)} qual=${qualification} ` +
    `criticalBlocked=${criticalBlocked}`
  )
}

// ---------------------------------------------------------------------------
// recomputeIndicatorInstance
// ---------------------------------------------------------------------------

/**
 * Recalcula qualification del IndicatorInstanceV2 a partir de sus subindicadores.
 * Regla: minimo de qualifications > 0 entre subindicadores; 0 si todos son 0.
 * Persiste en v2_indicator_instances.
 * Idempotente.
 */
export const recomputeIndicatorInstance = async (
  indicatorInstanceId: string
): Promise<void> => {
  const instance = (await indicatorInstanceRepository.findById(
    indicatorInstanceId
  )) as unknown as {
    _id: mongoose.Types.ObjectId
    subindicators: mongoose.Types.ObjectId[]
  } | null

  if (!instance) {
    logger.info(
      `scoring.recomputeIndicatorInstance: instance ${indicatorInstanceId} no encontrada`
    )
    return
  }

  const subIds = (instance.subindicators ?? []).map((s) => s.toString())

  if (subIds.length === 0) {
    await indicatorInstanceRepository.updateById(indicatorInstanceId, {
      qualification: 0,
      lastUpdate: new Date()
    })
    return
  }

  // Cargar todos los subindicadores del instance para leer su qualification.
  const subs = (await subindicatorRepository.findAll({
    _id: { $in: subIds.map((id) => new mongoose.Types.ObjectId(id)) }
  })) as unknown as Array<{ qualification: number }>

  const qualifications = subs.map((s) => s.qualification ?? 0)
  const nonZero = qualifications.filter((q) => q > 0)

  const qualification = nonZero.length > 0 ? Math.min(...nonZero) : 0

  await indicatorInstanceRepository.updateById(indicatorInstanceId, {
    qualification,
    lastUpdate: new Date()
  })

  logger.info(
    `scoring.recomputeIndicatorInstance: instance=${indicatorInstanceId} ` +
    `quals=[${qualifications.join(',')}] result=${qualification}`
  )
}

// ---------------------------------------------------------------------------
// recomputeAfterEvidenceChange
// ---------------------------------------------------------------------------

/**
 * Atajo para cablear el recompute en evidence.routes tras qualify/publish/delete.
 * 1. Recomputa el subindicador.
 * 2. Busca el IndicatorInstance padre y lo recomputa.
 * Registra audit 'score.recompute' en ambos pasos.
 */
export const recomputeAfterEvidenceChange = async (
  subindicatorId: string,
  actor?: string
): Promise<void> => {
  await recomputeSubindicator(subindicatorId)

  // Obtener indicatorInstanceId del subindicador.
  const sub = (await subindicatorRepository.findById(subindicatorId)) as unknown as SubindicatorLean | null
  if (!sub) return

  const instanceId = sub.indicatorInstanceId?.toString()
  if (!instanceId) return

  await recomputeIndicatorInstance(instanceId)

  if (actor) {
    await auditService.record({
      actor,
      action: 'score.recompute',
      entityType: 'subindicator',
      entityId: subindicatorId,
      meta: { indicatorInstanceId: instanceId }
    })
  }
}

// ---------------------------------------------------------------------------
// recomputeAfterSourceDocumentVerify
// ---------------------------------------------------------------------------

/**
 * Recomputa multiples subindicadores (y sus instances) tras la propagacion
 * de verified de un SourceDocument. Usa un Set para evitar recomputos duplicados.
 */
export const recomputeAfterSourceDocumentVerify = async (
  subindicatorIds: string[],
  actor?: string
): Promise<void> => {
  const uniqueSubs = [...new Set(subindicatorIds)]
  const instanceIds = new Set<string>()

  for (const subId of uniqueSubs) {
    await recomputeSubindicator(subId)
    const sub = (await subindicatorRepository.findById(subId)) as unknown as SubindicatorLean | null
    if (sub?.indicatorInstanceId) {
      instanceIds.add(sub.indicatorInstanceId.toString())
    }
  }

  for (const instanceId of instanceIds) {
    await recomputeIndicatorInstance(instanceId)
  }

  if (actor && uniqueSubs.length > 0) {
    await auditService.record({
      actor,
      action: 'score.recompute',
      entityType: 'source_document',
      entityId: uniqueSubs[0],
      meta: { subindicatorIds: uniqueSubs, instanceIds: [...instanceIds] }
    })
  }
}

// ---------------------------------------------------------------------------
// Export por defecto (objeto servicio, analogo a audit.service)
// ---------------------------------------------------------------------------

const scoringService = {
  recomputeSubindicator,
  recomputeIndicatorInstance,
  recomputeAfterEvidenceChange,
  recomputeAfterSourceDocumentVerify
}

export default scoringService
