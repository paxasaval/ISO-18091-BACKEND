// ===========================================================================
// Source Document Service v2 — biblioteca de documentos fuente (POA/evidencia).
// ===========================================================================
//
// Decision de diseno (FE + backend): toda evidencia subida con documento debe
// poblar la biblioteca (v2_source_documents), con DEDUPE + reuso explicito:
//   - Al subir un documento NUEVO (link sin sourceId), se crea/enlaza un
//     SourceDocument y la evidencia queda referenciandolo por sourceId.
//   - Si dos evidencias comparten el mismo (gadId, link), reutilizan el mismo
//     SourceDocument (no se duplica el documento en la biblioteca).
//   - El reuso explicito (el usuario elige un documento existente) llega como
//     body.sourceId desde el FE y NO pasa por aqui.
//
// El GAD/periodo/anio del SourceDocument NO viven en la evidencia: se resuelven
// subiendo por subindicatorId -> IndicatorInstance -> gadId/period/year.
// ===========================================================================

import mongoose from 'mongoose'
import subindicatorRepository from '../repositories/subindicator.repository'
import indicatorInstanceRepository from '../repositories/indicator-instance.repository'
import sourceDocumentRepository from '../repositories/source-document.repository'
import { normalizeSourceName } from '../utils/source-name'
import logger from '../../utils/logger'

interface SourceContext {
  gadId: mongoose.Types.ObjectId
  periodId?: mongoose.Types.ObjectId
  year?: string
}

interface SubindicatorLean {
  indicatorInstanceId?: mongoose.Types.ObjectId
}

interface IndicatorInstanceLean {
  gadId?: mongoose.Types.ObjectId
  period?: mongoose.Types.ObjectId
  year?: string
}

// Resuelve el contexto (gad/periodo/anio) de un subindicador subiendo por la
// instancia de indicador. Devuelve null si el subindicador o la instancia no
// existen o no tienen gadId (no se puede crear un SourceDocument sin gad).
export const resolveSourceContext = async (
  subindicatorId: string | mongoose.Types.ObjectId
): Promise<SourceContext | null> => {
  const sub = (await subindicatorRepository.findById(
    subindicatorId.toString()
  )) as unknown as SubindicatorLean | null
  if (!sub || !sub.indicatorInstanceId) return null

  const inst = (await indicatorInstanceRepository.findById(
    sub.indicatorInstanceId.toString()
  )) as unknown as IndicatorInstanceLean | null
  if (!inst || !inst.gadId) return null

  return { gadId: inst.gadId, periodId: inst.period, year: inst.year }
}

interface FindOrCreateInput {
  subindicatorId: string | mongoose.Types.ObjectId
  name: string
  link: string
  uploadedBy?: string | mongoose.Types.ObjectId
}

// Busca un SourceDocument existente por (gadId, link) o lo crea. Devuelve el id
// del SourceDocument, o null si no hay link o no se pudo resolver el gad.
// Idempotente: llamarlo dos veces con el mismo (gadId, link) devuelve el mismo id.
export const findOrCreateSourceForEvidence = async (
  input: FindOrCreateInput
): Promise<mongoose.Types.ObjectId | null> => {
  if (!input.link) return null

  const ctx = await resolveSourceContext(input.subindicatorId)
  if (!ctx) {
    logger.info(
      `source-document.service: no se resolvio el gad para el subindicador ${input.subindicatorId}; ` +
      'no se puebla la biblioteca para esta evidencia.'
    )
    return null
  }

  // Dedupe por (gadId, nombre normalizado): alineado con la deteccion de
  // duplicados del FE. Si ya existe un documento con ese nombre en la biblioteca
  // del GAD, se reutiliza (la evidencia conserva su propio link al archivo subido).
  const nameNormalized = normalizeSourceName(input.name)
  const existing = (await sourceDocumentRepository.findOne({
    gadId: ctx.gadId,
    nameNormalized
  } as Record<string, unknown>)) as unknown as { _id: mongoose.Types.ObjectId } | null
  if (existing) return existing._id

  const data: Record<string, unknown> = {
    gadId: ctx.gadId,
    name: input.name,
    nameNormalized,
    link: input.link,
    verified: false,
    createdAt: new Date()
  }
  if (ctx.periodId) data.periodId = ctx.periodId
  if (ctx.year) data.year = ctx.year
  if (input.uploadedBy) {
    data.uploadedBy = new mongoose.Types.ObjectId(input.uploadedBy.toString())
  }

  const created = (await sourceDocumentRepository.create(
    data as Parameters<typeof sourceDocumentRepository.create>[0]
  )) as unknown as { _id: mongoose.Types.ObjectId }
  return created._id
}

export default { resolveSourceContext, findOrCreateSourceForEvidence }
