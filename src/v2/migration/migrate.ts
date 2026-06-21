// ===========================================================================
// Script de migracion idempotente v1 → v2.
// Uso:
//   npm run migrate:v2              (dry-run por defecto: solo lee y reporta)
//   npm run migrate:v2 -- --dry-run (idem)
//   npm run migrate:v2 -- --write   (escribe en colecciones v2_*)
//
// Idempotencia: usa updateOne({ _id }, $set, { upsert: true }) preservando
// el _id original de v1 en los documentos v2.
//
// Orden de migracion (independientes → dependientes):
//   1. rol / valuation / ods
//   2. user / gad / indicator (catalogo)
//   3. type / characteristic
//   4. period / indicatorInstance / subindicator / evidence
//   5. characteristic_assessments (rubrica consolidada por UNION)
//   6. recompute scoring (subindicadores → instancias)
//
// Notas sobre el scoring:
//   Los campos Type.red / Type.yellow en v1 son STRING (p.ej "0.50").
//   El scoring.service v2 los parsea con parseFloat, por lo que funciona
//   aunque sean string. Los defaults 0.50/0.75 se usan cuando parseFloat
//   devuelve NaN. Ver documentacion en scoring.service.ts.
//
// Salida: docs/refactor-reports/migracion-v2-informe.md
// ===========================================================================

import mongoose from 'mongoose'
import path from 'path'
import fs from 'fs'

// ---- Modelos v1 (solo lectura) ----
import RolV1 from '../../../models/rol'
import ValuationV1 from '../../../models/valuation'
import OdsV1 from '../../../models/ods'
import UserV1 from '../../../models/users'
import GadV1 from '../../../models/gad'
import IndicatorV1 from '../../../models/indicator'
import TypeV1 from '../../../models/type'
import CharacteristicV1 from '../../../models/characteristic'
import PeriodV1 from '../../../models/period'
import IndicatorInstanceV1 from '../../../models/indicatorInstance'
import SubindicatorV1 from '../../../models/subindicator'
import EvidenceV1 from '../../../models/evidence'
import RubricV1 from '../../../models/rubric'

// ---- Modelos v2 (destino) ----
import RolV2 from '../models/rol.model'
import ValuationV2 from '../models/valuation.model'
import OdsV2 from '../models/ods.model'
import UserV2 from '../models/user.model'
import GadV2 from '../models/gad.model'
import IndicatorV2 from '../models/indicator.model'
import TypeV2 from '../models/type.model'
import CharacteristicV2 from '../models/characteristic.model'
import PeriodV2 from '../models/period.model'
import IndicatorInstanceV2 from '../models/indicator-instance.model'
import SubindicatorV2 from '../models/subindicator.model'
import EvidenceV2 from '../models/evidence.model'
import CharacteristicAssessmentV2 from '../models/characteristic-assessment.model'

// ---- Utiles ----
import { permissionsForRole } from '../constants/permissions'
import {
  recomputeSubindicator,
  recomputeIndicatorInstance
} from '../services/scoring.service'
import { slugify } from './slugify'
import logger from '../../utils/logger'

// ---------------------------------------------------------------------------
// Tipos internos
// ---------------------------------------------------------------------------

export interface MigrationOptions {
  write: boolean
  connection?: mongoose.Connection
}

interface MigrationReport {
  counts: Record<string, { v1: number; v2written: number }>
  scoringDiffs: Array<{
    collection: string
    id: string
    oldQualification: number
    newQualification: number
    colorChange: string
  }>
  rubricConsolidations: Array<{
    subindicatorId: string
    characteristicId: string
    evidenceIds: string[]
    criteria: Array<{ valuationId: string; met: boolean; weight: number }>
    verified: boolean
  }>
  anomalies: string[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const qualColor = (q: number): string => {
  if (q === 0) return 'sin evaluar'
  if (q === 1) return 'rojo'
  if (q === 2) return 'amarillo'
  return 'verde'
}

const upsertById = async <T>(
  model: mongoose.Model<T>,
  id: mongoose.Types.ObjectId,
  data: Record<string, unknown>,
  write: boolean
): Promise<void> => {
  if (!write) return
  await model.updateOne(
    { _id: id } as mongoose.FilterQuery<T>,
    { $set: { _id: id, ...data } } as mongoose.UpdateQuery<T>,
    { upsert: true }
  )
}

// ---------------------------------------------------------------------------
// Etapa 1: Rol
// ---------------------------------------------------------------------------

const migrateRols = async (
  report: MigrationReport,
  write: boolean
): Promise<void> => {
  const docs = await RolV1.find().lean()
  report.counts['rols'] = { v1: docs.length, v2written: 0 }

  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i]
    const name: string = (doc as unknown as { name: string }).name
    const description: string = (doc as unknown as { description: string }).description
    const id = (doc as unknown as { _id: mongoose.Types.ObjectId })._id

    const slug = slugify(name)
    const code = slug
    const permissions = permissionsForRole(name)

    await upsertById(RolV2, id, {
      name,
      description,
      code,
      slug,
      order: i + 1,
      permissions
    }, write)

    report.counts['rols'].v2written++
  }

  // Crear Metodólogo si no existe en v1
  const methodologoExists = docs.find(
    (d: unknown) => (d as { name: string }).name === 'Metodólogo'
  )
  if (!methodologoExists) {
    if (write) {
      const existingV2 = await RolV2.findOne({ name: 'Metodólogo' }).lean()
      if (!existingV2) {
        await RolV2.create({
          name: 'Metodólogo',
          description: 'Configura criterios, rúbrica, pesos y catálogo ISO',
          code: 'metodologo',
          slug: 'metodlogo',
          order: docs.length + 1,
          permissions: permissionsForRole('Metodólogo')
        })
        report.anomalies.push('Creado rol Metodólogo (no existía en v1)')
      }
    } else {
      report.anomalies.push('[dry-run] Se crearía rol Metodólogo (no existe en v1)')
    }
  }
}

// ---------------------------------------------------------------------------
// Etapa 2: Valuation
// ---------------------------------------------------------------------------

const migrateValuations = async (
  report: MigrationReport,
  write: boolean
): Promise<void> => {
  const docs = await ValuationV1.find().lean()
  report.counts['valuations'] = { v1: docs.length, v2written: 0 }

  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i] as unknown as {
      _id: mongoose.Types.ObjectId
      name: string
      category: string
      maxValue: number
    }

    await upsertById(ValuationV2, doc._id, {
      name: doc.name,
      category: doc.category,
      maxValue: doc.maxValue,
      slug: slugify(doc.name),
      order: i + 1
    }, write)

    report.counts['valuations'].v2written++
  }
}

// ---------------------------------------------------------------------------
// Etapa 3: ODS
// ---------------------------------------------------------------------------

const migrateOds = async (
  report: MigrationReport,
  write: boolean
): Promise<void> => {
  const docs = await OdsV1.find().lean()
  report.counts['ods'] = { v1: docs.length, v2written: 0 }

  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i] as unknown as {
      _id: mongoose.Types.ObjectId
      number: number
      name: string
      img: string
    }

    await upsertById(OdsV2, doc._id, {
      number: doc.number,
      name: doc.name,
      img: doc.img,
      slug: slugify(doc.name),
      order: i + 1
    }, write)

    report.counts['ods'].v2written++
  }
}

// ---------------------------------------------------------------------------
// Etapa 4: User
// ---------------------------------------------------------------------------

const migrateUsers = async (
  report: MigrationReport,
  write: boolean
): Promise<void> => {
  const docs = await UserV1.find().lean()
  report.counts['users'] = { v1: docs.length, v2written: 0 }

  for (const doc of docs) {
    const d = doc as unknown as {
      _id: mongoose.Types.ObjectId
      name: string
      mail: string
      image?: string
      password: string
      rol: mongoose.Types.ObjectId
      created: Date
      lastUpdate: Date
      state: boolean
      gadID: mongoose.Types.ObjectId
    }

    await upsertById(UserV2, d._id, {
      name: d.name,
      email: d.mail,           // mail → email
      image: d.image,
      password: d.password,
      rol: d.rol,
      created: d.created,
      lastUpdate: d.lastUpdate,
      state: d.state,
      gadId: d.gadID           // gadID → gadId
    }, write)

    report.counts['users'].v2written++
  }
}

// ---------------------------------------------------------------------------
// Etapa 5: GAD
// ---------------------------------------------------------------------------

const migrateGads = async (
  report: MigrationReport,
  write: boolean
): Promise<void> => {
  const docs = await GadV1.find().lean()
  report.counts['gads'] = { v1: docs.length, v2written: 0 }

  for (const doc of docs) {
    const d = doc as unknown as {
      _id: mongoose.Types.ObjectId
      name: string
      code: string
      city: string
      country: string
      size: number
      admin: mongoose.Types.ObjectId[]
      staff: mongoose.Types.ObjectId[]
      users: mongoose.Types.ObjectId[]
      state: boolean
      publishAuto: boolean
      report: mongoose.Types.ObjectId[]
      reportDefault?: mongoose.Types.ObjectId
    }

    await upsertById(GadV2, d._id, {
      name: d.name,
      code: d.code,
      city: d.city,
      country: d.country,
      size: d.size,
      admin: d.admin ?? [],
      staff: d.staff ?? [],
      users: d.users ?? [],
      state: d.state,
      publishAuto: d.publishAuto,
      report: d.report ?? [],
      reportDefault: d.reportDefault
    }, write)

    report.counts['gads'].v2written++
  }
}

// ---------------------------------------------------------------------------
// Etapa 6: Indicator (catálogo)
// ---------------------------------------------------------------------------

const migrateIndicators = async (
  report: MigrationReport,
  write: boolean
): Promise<void> => {
  const docs = await IndicatorV1.find().lean()
  report.counts['indicators'] = { v1: docs.length, v2written: 0 }

  for (let i = 0; i < docs.length; i++) {
    const d = docs[i] as unknown as {
      _id: mongoose.Types.ObjectId
      name: string
      description: string
      number: number
      quadrant: number
      quadrantName: string
      red: string
      yellow: string
      green: string
      ods: mongoose.Types.ObjectId[]
    }

    await upsertById(IndicatorV2, d._id, {
      name: d.name,
      description: d.description,
      number: d.number,
      quadrant: d.quadrant,
      quadrantName: d.quadrantName,
      red: d.red,
      yellow: d.yellow,
      green: d.green,
      ods: d.ods ?? [],
      slug: slugify(d.name),
      order: i + 1
    }, write)

    report.counts['indicators'].v2written++
  }
}

// ---------------------------------------------------------------------------
// Etapa 7: Type
// ---------------------------------------------------------------------------

const migrateTypes = async (
  report: MigrationReport,
  write: boolean
): Promise<void> => {
  const docs = await TypeV1.find().lean()
  report.counts['types'] = { v1: docs.length, v2written: 0 }

  // Nota: Type.red / Type.yellow en v1 son STRING (p.ej "0.50").
  // El scoring.service v2 los parsea con parseFloat correctamente.
  // Se copian tal cual para que el servicio funcione igual.
  report.anomalies.push(
    'Type.red/Type.yellow son STRING en v1 (p.ej "0.50"). ' +
    'El scoring.service los parsea con parseFloat; defaults 0.50/0.75 si NaN. ' +
    'Se copian sin convertir a number para conservar el valor exacto.'
  )

  for (let i = 0; i < docs.length; i++) {
    const d = docs[i] as unknown as {
      _id: mongoose.Types.ObjectId
      name: string
      red: string
      yellow: string
      green: string
      mandatory: boolean
      extraInfo: unknown
      characteristics: mongoose.Types.ObjectId[]
    }

    await upsertById(TypeV2, d._id, {
      name: d.name,
      red: d.red,
      yellow: d.yellow,
      green: d.green,
      mandatory: d.mandatory,
      extraInfo: d.extraInfo ?? {},
      characteristics: d.characteristics ?? [],
      slug: slugify(d.name),
      order: i + 1
    }, write)

    report.counts['types'].v2written++
  }
}

// ---------------------------------------------------------------------------
// Etapa 8: Characteristic
// ---------------------------------------------------------------------------

const migrateCharacteristics = async (
  report: MigrationReport,
  write: boolean
): Promise<void> => {
  const docs = await CharacteristicV1.find().lean()
  report.counts['characteristics'] = { v1: docs.length, v2written: 0 }

  for (let i = 0; i < docs.length; i++) {
    const d = docs[i] as unknown as {
      _id: mongoose.Types.ObjectId
      name: string
      type: number
      group: string
      groupName: string
      help?: string
      format?: string
      isRequired: boolean
      required: boolean
      score?: number
      tier: number
      unique: boolean
      parts: string[]
      valuation: mongoose.Types.ObjectId[]
      extras: unknown
      allowed_formats: string[]
    }

    // type===2 → 'link'; cualquier otro → 'file'
    const inputKind: 'file' | 'link' = d.type === 2 ? 'link' : 'file'

    await upsertById(CharacteristicV2, d._id, {
      name: d.name,
      group: d.group,
      groupName: d.groupName,
      help: d.help,
      format: d.format,
      isRequired: d.isRequired,
      required: d.required,
      score: d.score,
      tier: d.tier,
      unique: d.unique,
      parts: d.parts ?? [],
      valuations: d.valuation ?? [],    // valuation → valuations
      extras: d.extras ?? {},
      allowedFormats: d.allowed_formats ?? [],  // allowed_formats → allowedFormats
      inputKind,
      isCover: false,
      slug: slugify(d.name),
      order: i + 1
    }, write)

    report.counts['characteristics'].v2written++
  }
}

// ---------------------------------------------------------------------------
// Etapa 9: Period
// ---------------------------------------------------------------------------

const migratePeriods = async (
  report: MigrationReport,
  write: boolean
): Promise<void> => {
  const docs = await PeriodV1.find().lean()
  report.counts['periods'] = { v1: docs.length, v2written: 0 }

  for (const doc of docs) {
    const d = doc as unknown as {
      _id: mongoose.Types.ObjectId
      year: string
      gad: mongoose.Types.ObjectId
      createdBy: mongoose.Types.ObjectId
    }

    await upsertById(PeriodV2, d._id, {
      year: d.year,
      gad: d.gad,
      createdBy: d.createdBy
    }, write)

    report.counts['periods'].v2written++
  }
}

// ---------------------------------------------------------------------------
// Etapa 10: IndicatorInstance
// ---------------------------------------------------------------------------

const migrateIndicatorInstances = async (
  report: MigrationReport,
  write: boolean
): Promise<void> => {
  const docs = await IndicatorInstanceV1.find().lean()
  report.counts['indicatorInstances'] = { v1: docs.length, v2written: 0 }

  for (const doc of docs) {
    const d = doc as unknown as {
      _id: mongoose.Types.ObjectId
      gadID: mongoose.Types.ObjectId
      indicatorID: mongoose.Types.ObjectId
      period: mongoose.Types.ObjectId
      year: string
      qualification: number
      create: Date
      state: boolean
      lastUpdate?: Date
      lastUpdateBy?: mongoose.Types.ObjectId
      createdBy?: mongoose.Types.ObjectId
      subindicators: mongoose.Types.ObjectId[]
    }

    await upsertById(IndicatorInstanceV2, d._id, {
      gadId: d.gadID,                       // gadID → gadId
      indicatorInstanceId: d.indicatorID,   // indicatorID → indicatorInstanceId
      period: d.period,
      year: d.year,
      qualification: d.qualification ?? 0,
      create: d.create,
      state: d.state,
      lastUpdate: d.lastUpdate,
      lastUpdateBy: d.lastUpdateBy,
      createdBy: d.createdBy,
      subindicators: d.subindicators ?? []
    }, write)

    report.counts['indicatorInstances'].v2written++
  }
}

// ---------------------------------------------------------------------------
// Etapa 11: Subindicator
// ---------------------------------------------------------------------------

const migrateSubindicators = async (
  report: MigrationReport,
  write: boolean
): Promise<void> => {
  const docs = await SubindicatorV1.find().lean()
  report.counts['subindicators'] = { v1: docs.length, v2written: 0 }

  for (const doc of docs) {
    const d = doc as unknown as {
      _id: mongoose.Types.ObjectId
      typeID: mongoose.Types.ObjectId
      indicadorID: mongoose.Types.ObjectId
      name: string
      requireCover: boolean
      cover?: string
      observationCover?: string
      isPlanned?: boolean
      isDiagnosed?: boolean
      responsible: string
      qualification: number
      score: number
      totalScore: number
      autoQualification: number
      lastUpdate?: Date
      lastUpdateBy?: mongoose.Types.ObjectId
      state: boolean
      created: Date
      createdBy: mongoose.Types.ObjectId
      commits: mongoose.Types.ObjectId[]
      evidences: mongoose.Types.ObjectId[]
      extraInfo: unknown
    }

    await upsertById(SubindicatorV2, d._id, {
      typeId: d.typeID,                           // typeID → typeId
      indicatorInstanceId: d.indicadorID,         // indicadorID → indicatorInstanceId
      name: d.name,
      requireCover: d.requireCover,
      cover: d.cover,
      observationCover: d.observationCover,
      isPlanned: d.isPlanned,
      isDiagnosed: d.isDiagnosed,
      responsibleText: d.responsible,             // responsible → responsibleText
      responsibleUserIds: [],                     // mapeo manual futuro
      qualification: d.qualification ?? 0,
      score: d.score ?? 0,
      totalScore: d.totalScore ?? 0,
      autoQualification: d.autoQualification ?? 0,
      lastUpdate: d.lastUpdate,
      lastUpdateBy: d.lastUpdateBy,
      state: d.state,
      created: d.created,
      createdBy: d.createdBy,
      commits: d.commits ?? [],
      evidences: d.evidences ?? [],
      extraInfo: d.extraInfo ?? {}
    }, write)

    report.counts['subindicators'].v2written++
  }
}

// ---------------------------------------------------------------------------
// Etapa 12: Evidence
// ---------------------------------------------------------------------------

const migrateEvidences = async (
  report: MigrationReport,
  write: boolean
): Promise<void> => {
  const docs = await EvidenceV1.find().lean()
  report.counts['evidences'] = { v1: docs.length, v2written: 0 }

  for (const doc of docs) {
    const d = doc as unknown as {
      _id: mongoose.Types.ObjectId
      characteristicID: mongoose.Types.ObjectId
      subIndicatorID: mongoose.Types.ObjectId
      name: string
      link: string
      note?: string
      content: Array<{ part: string; key: boolean }>
      state?: boolean
      verified: boolean
      qualification?: number
      totalRubric?: number
      qualificationBy?: mongoose.Types.ObjectId
      qualificationDate?: Date
      author: mongoose.Types.ObjectId
      commits: mongoose.Types.ObjectId[]
      extras: unknown
    }

    await upsertById(EvidenceV2, d._id, {
      characteristicId: d.characteristicID,   // characteristicID → characteristicId
      subindicatorId: d.subIndicatorID,       // subIndicatorID → subindicatorId
      name: d.name,
      link: d.link,
      note: d.note,
      content: d.content ?? [],
      state: d.state,
      verified: d.verified ?? false,
      qualification: d.qualification,
      totalRubric: d.totalRubric,
      qualificationBy: d.qualificationBy,
      qualificationDate: d.qualificationDate,
      author: d.author,
      commits: d.commits ?? [],
      kind: 'principal',    // default según spec
      sourceId: null,       // no detectar POA aquí; flujo futuro
      pages: null,
      extras: d.extras ?? {}
    }, write)

    report.counts['evidences'].v2written++
  }
}

// ---------------------------------------------------------------------------
// Etapa 13: CharacteristicAssessments (rubrica consolidada por UNION)
//
// Lógica:
//   Para cada par (subindicatorId, characteristicId):
//     1. Obtener todas las Evidence v1 que apuntan a esa (characteristic, subindicator).
//     2. Para cada evidencia, cargar sus Rubric v1 (rubric[]).
//     3. Para cada valuationId encontrado en esos rubrics, aplicar regla UNION:
//        met=true si ALGUNA evidencia tiene qualification > 0 para esa valuation.
//     4. verified=true si ALGUNA de las evidencias estaba verificada.
//     5. weight = valuation.maxValue (cargado de la coleccion v1 Valuation).
// ---------------------------------------------------------------------------

const migrateCharacteristicAssessments = async (
  report: MigrationReport,
  write: boolean
): Promise<void> => {
  report.counts['characteristic_assessments'] = { v1: 0, v2written: 0 }

  // Cargar todos los rubrics v1 agrupados por evidenceId para lookup eficiente
  const allRubrics = await RubricV1.find().lean() as unknown as Array<{
    _id: mongoose.Types.ObjectId
    valuation: mongoose.Types.ObjectId
    qualification: number
    evidence: mongoose.Types.ObjectId
  }>

  // Cargar valuations para obtener maxValue
  const valuationsMap = new Map<string, number>()
  const valuationDocs = await ValuationV1.find().lean() as unknown as Array<{
    _id: mongoose.Types.ObjectId
    maxValue: number
  }>
  for (const v of valuationDocs) {
    valuationsMap.set(v._id.toString(), v.maxValue)
  }

  // Indexar rubrics por evidenceId
  const rubricsByEvidence = new Map<string, typeof allRubrics>()
  for (const r of allRubrics) {
    const eid = r.evidence.toString()
    const existing = rubricsByEvidence.get(eid) ?? []
    existing.push(r)
    rubricsByEvidence.set(eid, existing)
  }
  report.counts['characteristic_assessments'].v1 = allRubrics.length

  // Cargar evidencias v1 con sus referencias
  const evidences = await EvidenceV1.find().lean() as unknown as Array<{
    _id: mongoose.Types.ObjectId
    characteristicID: mongoose.Types.ObjectId
    subIndicatorID: mongoose.Types.ObjectId
    verified: boolean
    rubric: mongoose.Types.ObjectId[]
  }>

  // Agrupar evidencias por (subindicatorId, characteristicId)
  const pairMap = new Map<string, {
    subindicatorId: mongoose.Types.ObjectId
    characteristicId: mongoose.Types.ObjectId
    evidences: typeof evidences
  }>()

  for (const ev of evidences) {
    if (!ev.subIndicatorID || !ev.characteristicID) continue
    const key = `${ev.subIndicatorID.toString()}::${ev.characteristicID.toString()}`
    const existing = pairMap.get(key)
    if (existing) {
      existing.evidences.push(ev)
    } else {
      pairMap.set(key, {
        subindicatorId: ev.subIndicatorID,
        characteristicId: ev.characteristicID,
        evidences: [ev]
      })
    }
  }

  for (const [, pair] of pairMap) {
    // Recolectar todos los rubrics de todas las evidencias de este par
    const allPairRubrics: Array<{
      valuationId: string
      qualification: number
      evidenceId: string
      evidenceVerified: boolean
    }> = []

    let pairVerified = false

    for (const ev of pair.evidences) {
      if (ev.verified) pairVerified = true

      const evRubrics = rubricsByEvidence.get(ev._id.toString()) ?? []
      for (const r of evRubrics) {
        allPairRubrics.push({
          valuationId: r.valuation.toString(),
          qualification: r.qualification,
          evidenceId: ev._id.toString(),
          evidenceVerified: ev.verified
        })
      }
    }

    // Agrupar por valuationId y aplicar regla UNION: met=true si alguna qualif>0
    const byValuation = new Map<string, { anyMet: boolean; weight: number }>()
    for (const r of allPairRubrics) {
      const existing = byValuation.get(r.valuationId) ?? {
        anyMet: false,
        weight: valuationsMap.get(r.valuationId) ?? 1
      }
      if (r.qualification > 0) {
        existing.anyMet = true
      }
      byValuation.set(r.valuationId, existing)
    }

    const criteria = Array.from(byValuation.entries()).map(([valuationId, v]) => ({
      valuationId: new mongoose.Types.ObjectId(valuationId),
      met: v.anyMet,
      weight: v.weight
    }))

    // Registrar consolidacion en el informe
    const consolidation = {
      subindicatorId: pair.subindicatorId.toString(),
      characteristicId: pair.characteristicId.toString(),
      evidenceIds: pair.evidences.map((e) => e._id.toString()),
      criteria: criteria.map((c) => ({
        valuationId: c.valuationId.toString(),
        met: c.met,
        weight: c.weight
      })),
      verified: pairVerified
    }
    report.rubricConsolidations.push(consolidation)

    if (write && criteria.length > 0) {
      const score = criteria.reduce((s, c) => s + (c.met ? c.weight : 0), 0)
      const totalRubric = criteria.reduce((s, c) => s + c.weight, 0)

      await CharacteristicAssessmentV2.updateOne(
        {
          subindicatorId: pair.subindicatorId,
          characteristicId: pair.characteristicId
        },
        {
          $set: {
            subindicatorId: pair.subindicatorId,
            characteristicId: pair.characteristicId,
            criteria,
            score,
            totalRubric,
            verified: pairVerified,
            sourceOverrides: []
          }
        },
        { upsert: true }
      )
      report.counts['characteristic_assessments'].v2written++
    } else if (criteria.length > 0) {
      report.counts['characteristic_assessments'].v2written++
    }
  }
}

// ---------------------------------------------------------------------------
// Etapa 14: Recompute scoring
// ---------------------------------------------------------------------------

const recomputeScoring = async (
  report: MigrationReport,
  write: boolean
): Promise<void> => {
  if (!write) {
    report.anomalies.push(
      '[dry-run] El recompute de scoring se omite. En --write se recalcularán ' +
      'qualification de todos los subindicadores e instancias.'
    )
    return
  }

  // Cargar subindicadores v2 para recompute
  const subindicators = await SubindicatorV2.find().lean() as unknown as Array<{
    _id: mongoose.Types.ObjectId
    indicatorInstanceId: mongoose.Types.ObjectId
    qualification: number
  }>

  const instancesSet = new Set<string>()

  for (const sub of subindicators) {
    const oldQual = sub.qualification ?? 0
    await recomputeSubindicator(sub._id.toString())

    // Leer la nueva qualification para el diff
    const updated = await SubindicatorV2.findById(sub._id).lean() as unknown as
      { qualification: number } | null

    const newQual = updated?.qualification ?? 0

    if (oldQual !== newQual) {
      report.scoringDiffs.push({
        collection: 'subindicators',
        id: sub._id.toString(),
        oldQualification: oldQual,
        newQualification: newQual,
        colorChange: `${qualColor(oldQual)} → ${qualColor(newQual)}`
      })
    }

    if (sub.indicatorInstanceId) {
      instancesSet.add(sub.indicatorInstanceId.toString())
    }
  }

  // Recompute instances
  const instances = await IndicatorInstanceV2.find().lean() as unknown as Array<{
    _id: mongoose.Types.ObjectId
    qualification: number
  }>

  for (const inst of instances) {
    const oldQual = inst.qualification ?? 0
    await recomputeIndicatorInstance(inst._id.toString())

    const updated = await IndicatorInstanceV2.findById(inst._id).lean() as unknown as
      { qualification: number } | null

    const newQual = updated?.qualification ?? 0

    if (oldQual !== newQual) {
      report.scoringDiffs.push({
        collection: 'indicatorInstances',
        id: inst._id.toString(),
        oldQualification: oldQual,
        newQualification: newQual,
        colorChange: `${qualColor(oldQual)} → ${qualColor(newQual)}`
      })
    }
  }

  logger.info(
    `scoring: recomputados ${subindicators.length} subindicadores, ` +
    `${instances.length} instancias. Diffs: ${report.scoringDiffs.length}`
  )
}

// ---------------------------------------------------------------------------
// Generar informe
// ---------------------------------------------------------------------------

const buildReport = (report: MigrationReport, write: boolean): string => {
  const mode = write ? 'WRITE' : 'DRY-RUN'
  const lines: string[] = [
    '# Informe de migración v1 → v2',
    '',
    `**Modo:** ${mode}`,
    `**Fecha:** ${new Date().toISOString()}`,
    '',
    '## Conteos por colección',
    '',
    '| Colección | Docs v1 | Escritos v2 |',
    '|-----------|---------|-------------|'
  ]

  for (const [col, counts] of Object.entries(report.counts)) {
    lines.push(`| ${col} | ${counts.v1} | ${counts.v2written} |`)
  }

  lines.push('', '## Diff de scoring (qualification cambiada)', '')

  if (report.scoringDiffs.length === 0) {
    lines.push('_Sin diffs de scoring (dry-run o no hay cambios)._')
  } else {
    lines.push('| Colección | ID | Antes | Después | Cambio color |')
    lines.push('|-----------|-----|-------|---------|--------------|')
    for (const d of report.scoringDiffs) {
      lines.push(
        `| ${d.collection} | ${d.id} | ${d.oldQualification} | ` +
        `${d.newQualification} | ${d.colorChange} |`
      )
    }
  }

  lines.push('', '## Consolidaciones de rúbrica', '')

  if (report.rubricConsolidations.length === 0) {
    lines.push('_Sin consolidaciones registradas._')
  } else {
    lines.push(
      `Se fusionaron ${report.rubricConsolidations.length} pares ` +
      '(subindicador, característica) desde rúbricas por evidencia a ' +
      'CharacteristicAssessment v2.',
      ''
    )
    for (const c of report.rubricConsolidations) {
      lines.push(
        `### Par ${c.subindicatorId} / ${c.characteristicId}`,
        `- Evidencias: ${c.evidenceIds.join(', ')}`,
        `- Criterios (UNION): ${JSON.stringify(c.criteria)}`,
        `- Verified: ${c.verified}`,
        ''
      )
    }
  }

  lines.push('', '## Anomalías / Decisiones', '')
  if (report.anomalies.length === 0) {
    lines.push('_Sin anomalías._')
  } else {
    for (const a of report.anomalies) {
      lines.push(`- ${a}`)
    }
  }

  lines.push(
    '',
    '---',
    '',
    '> **Riesgos para ejecución real:**',
    '> 1. Hacer backup de las colecciones v2_* antes de --write.',
    '> 2. IP del cliente debe estar en la whitelist de Atlas.',
    '> 3. El recompute de scoring puede cambiar colores públicos (ver diff arriba). ',
    '>    Validar con el GAD antes del freeze de v1.',
    '> 4. responsibleUserIds queda vacío; el mapeo a usuarios es manual/futuro.',
    '> 5. sourceId de evidencias queda null; la biblioteca POA es Tema 5 (futuro).'
  )

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Modo READ-ONLY: diff de puntajes LEGIBLE (para validación del GAD)
//
// Re-deriva el diff de forma idempotente sin reescribir nada: compara la
// `qualification` de v1 (colecciones legacy, intactas = valor "antes") contra
// las `v2_*` (ya recalculadas = "después") y resuelve nombres (subindicador,
// indicador con cuadrante/número, año y GAD). Escribe
// docs/refactor-reports/diff-puntajes-legible.md agrupado por GAD → cuadrante.
// ---------------------------------------------------------------------------

interface ReadableDiffRow {
  gad: string
  quadrant: string
  indicator: string
  entity: 'subindicador' | 'indicador'
  name: string
  year: string
  before: number
  after: number
  change: string
}

const leanAll = async <T>(
  model: mongoose.Model<T>
): Promise<Record<string, unknown>[]> =>
  model.find({}).lean() as unknown as Promise<Record<string, unknown>[]>

const buildReadableDiff = (rows: ReadableDiffRow[]): string => {
  const lines: string[] = []
  lines.push('# Diff de puntajes (legible) v1 → v2', '')
  lines.push(`**Fecha:** ${new Date().toISOString()}`, '')
  lines.push(`Total de cambios de color: **${rows.length}**`, '')

  const byChange = new Map<string, number>()
  for (const r of rows) byChange.set(r.change, (byChange.get(r.change) ?? 0) + 1)
  lines.push('## Resumen por cambio', '', '| Cambio | Cantidad |', '|---|---|')
  for (const [change, n] of [...byChange.entries()].sort((a, b) => b[1] - a[1])) {
    lines.push(`| ${change} | ${n} |`)
  }
  lines.push('')

  const byGad = new Map<string, ReadableDiffRow[]>()
  for (const r of rows) {
    const arr = byGad.get(r.gad) ?? []
    arr.push(r)
    byGad.set(r.gad, arr)
  }
  lines.push('## Detalle por GAD y cuadrante', '')
  for (const [gad, gadRows] of [...byGad.entries()].sort()) {
    lines.push(`### GAD: ${gad}`, '')
    const byQ = new Map<string, ReadableDiffRow[]>()
    for (const r of gadRows) {
      const arr = byQ.get(r.quadrant) ?? []
      arr.push(r)
      byQ.set(r.quadrant, arr)
    }
    for (const [q, qRows] of [...byQ.entries()].sort()) {
      lines.push(
        `#### ${q}`,
        '',
        '| Tipo | Indicador | Subindicador | Año | Antes | Después | Cambio |',
        '|---|---|---|---|---|---|---|'
      )
      const sorted = qRows.sort((a, b) => a.indicator.localeCompare(b.indicator))
      for (const r of sorted) {
        const subName = r.entity === 'subindicador' ? r.name : '—'
        lines.push(
          `| ${r.entity} | ${r.indicator} | ${subName} | ${r.year} | ` +
            `${qualColor(r.before)} | ${qualColor(r.after)} | ${r.change} |`
        )
      }
      lines.push('')
    }
  }
  return lines.join('\n')
}

/**
 * Genera el diff de puntajes legible (READ-ONLY). No escribe en v2_*.
 * Devuelve las filas y escribe el informe legible en docs/refactor-reports/.
 */
export const runDiffReport = async (): Promise<ReadableDiffRow[]> => {
  process.stdout.write('[migrate:v2] Generando diff legible (read-only)...\n')

  // v1 = valor "antes" (colecciones legacy intactas)
  const oldSub = new Map<string, number>()
  for (const s of await leanAll(SubindicatorV1)) {
    oldSub.set(String(s._id), Number(s.qualification ?? 0))
  }
  const oldInst = new Map<string, number>()
  for (const i of await leanAll(IndicatorInstanceV1)) {
    oldInst.set(String(i._id), Number(i.qualification ?? 0))
  }

  // v2 = valor "después" + nombres
  const v2Subs = await leanAll(SubindicatorV2)
  const v2Insts = await leanAll(IndicatorInstanceV2)
  const instById = new Map<string, Record<string, unknown>>()
  for (const i of v2Insts) instById.set(String(i._id), i)
  const indById = new Map<string, Record<string, unknown>>()
  for (const i of await leanAll(IndicatorV2)) indById.set(String(i._id), i)
  const gadById = new Map<string, Record<string, unknown>>()
  for (const g of await leanAll(GadV2)) gadById.set(String(g._id), g)

  const ctxOf = (inst?: Record<string, unknown>) => {
    const gad = inst ? gadById.get(String(inst.gadId)) : undefined
    const ind = inst ? indById.get(String(inst.indicatorInstanceId)) : undefined
    return {
      gad: gad ? String(gad.name ?? gad._id) : '(sin GAD)',
      quadrant: ind
        ? `Q${ind.quadrant ?? '?'}${ind.quadrantName ? ' ' + ind.quadrantName : ''}`
        : '(sin cuadrante)',
      indicator: ind
        ? `${ind.quadrant ?? '?'}.${ind.number ?? '?'} ${ind.name ?? ''}`.trim()
        : '(sin indicador)',
      year: inst ? String(inst.year ?? '') : ''
    }
  }

  const rows: ReadableDiffRow[] = []

  for (const s of v2Subs) {
    const id = String(s._id)
    const before = oldSub.get(id) ?? 0
    const after = Number(s.qualification ?? 0)
    if (before === after) continue
    const ctx = ctxOf(instById.get(String(s.indicatorInstanceId)))
    rows.push({
      gad: ctx.gad,
      quadrant: ctx.quadrant,
      indicator: ctx.indicator,
      entity: 'subindicador',
      name: String(s.name ?? id),
      year: ctx.year,
      before,
      after,
      change: `${qualColor(before)} → ${qualColor(after)}`
    })
  }

  for (const i of v2Insts) {
    const id = String(i._id)
    const before = oldInst.get(id) ?? 0
    const after = Number(i.qualification ?? 0)
    if (before === after) continue
    const ctx = ctxOf(i)
    rows.push({
      gad: ctx.gad,
      quadrant: ctx.quadrant,
      indicator: ctx.indicator,
      entity: 'indicador',
      name: ctx.indicator,
      year: ctx.year,
      before,
      after,
      change: `${qualColor(before)} → ${qualColor(after)}`
    })
  }

  const out = path.resolve(
    __dirname,
    '../../../docs/refactor-reports/diff-puntajes-legible.md'
  )
  try {
    fs.mkdirSync(path.dirname(out), { recursive: true })
    fs.writeFileSync(out, buildReadableDiff(rows), 'utf8')
    process.stdout.write(`[migrate:v2] Diff legible escrito en: ${out}\n`)
  } catch (err) {
    logger.error('No se pudo escribir el diff legible:', err)
  }

  process.stdout.write(`[migrate:v2] Diff legible: ${rows.length} cambios.\n`)
  return rows
}

// ---------------------------------------------------------------------------
// Función principal exportada (para tests y CLI)
// ---------------------------------------------------------------------------

/**
 * Ejecuta la migración v1 → v2.
 *
 * @param options.write  true = escribe en v2_*; false = dry-run (solo reporta).
 * @param options.connection  Conexión mongoose a usar (para tests en memoria).
 *                            Si se omite, usa la conexión global activa.
 */
export const runMigration = async (
  options: MigrationOptions
): Promise<MigrationReport> => {
  const { write } = options

  const report: MigrationReport = {
    counts: {},
    scoringDiffs: [],
    rubricConsolidations: [],
    anomalies: []
  }

  const modeLabel = write ? 'WRITE' : 'DRY-RUN'
  process.stdout.write(`[migrate:v2] Iniciando en modo ${modeLabel}\n`)

  process.stdout.write('[migrate:v2] Etapa 1/14: rols\n')
  await migrateRols(report, write)

  process.stdout.write('[migrate:v2] Etapa 2/14: valuations\n')
  await migrateValuations(report, write)

  process.stdout.write('[migrate:v2] Etapa 3/14: ods\n')
  await migrateOds(report, write)

  process.stdout.write('[migrate:v2] Etapa 4/14: users\n')
  await migrateUsers(report, write)

  process.stdout.write('[migrate:v2] Etapa 5/14: gads\n')
  await migrateGads(report, write)

  process.stdout.write('[migrate:v2] Etapa 6/14: indicators (catalogo)\n')
  await migrateIndicators(report, write)

  process.stdout.write('[migrate:v2] Etapa 7/14: types\n')
  await migrateTypes(report, write)

  process.stdout.write('[migrate:v2] Etapa 8/14: characteristics\n')
  await migrateCharacteristics(report, write)

  process.stdout.write('[migrate:v2] Etapa 9/14: periods\n')
  await migratePeriods(report, write)

  process.stdout.write('[migrate:v2] Etapa 10/14: indicatorInstances\n')
  await migrateIndicatorInstances(report, write)

  process.stdout.write('[migrate:v2] Etapa 11/14: subindicators\n')
  await migrateSubindicators(report, write)

  process.stdout.write('[migrate:v2] Etapa 12/14: evidences\n')
  await migrateEvidences(report, write)

  process.stdout.write('[migrate:v2] Etapa 13/14: characteristic_assessments (rubrica UNION)\n')
  await migrateCharacteristicAssessments(report, write)

  process.stdout.write('[migrate:v2] Etapa 14/14: recompute scoring\n')
  await recomputeScoring(report, write)

  process.stdout.write('[migrate:v2] Migracion completada.\n')

  // Escribir informe
  const reportContent = buildReport(report, write)
  const reportPath = path.resolve(
    __dirname,
    '../../../docs/refactor-reports/migracion-v2-informe.md'
  )

  try {
    fs.mkdirSync(path.dirname(reportPath), { recursive: true })
    fs.writeFileSync(reportPath, reportContent, 'utf8')
    process.stdout.write(`[migrate:v2] Informe escrito en: ${reportPath}\n`)
  } catch (err) {
    logger.error('No se pudo escribir el informe:', err)
  }

  return report
}

// ---------------------------------------------------------------------------
// Punto de entrada CLI
// ---------------------------------------------------------------------------

const isMainModule = (): boolean => {
  // En tsx/ts-node, import.meta no siempre está disponible en CJS.
  // Comparamos process.argv con el archivo actual.
  const mainArg = process.argv[1]
  return mainArg !== undefined && (
    mainArg.endsWith('migrate.ts') ||
    mainArg.endsWith('migrate.js')
  )
}

if (isMainModule()) {
  const args = process.argv.slice(2)
  const doDiffOnly = args.includes('--diff-only')
  const doWrite = args.includes('--write')
  const isDryRun = args.includes('--dry-run') || !doWrite

  if (doDiffOnly) {
    process.stdout.write(
      '[migrate:v2] Modo --diff-only: solo lectura, genera el diff legible.\n'
    )
  } else if (isDryRun && !doWrite) {
    process.stdout.write(
      '[migrate:v2] Sin --write: ejecutando en DRY-RUN (sin escritura en BD).\n'
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv').config()
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { MONGODB_URI } = require('../../../utils/config')

  if (!MONGODB_URI) {
    process.stderr.write('[migrate:v2] ERROR: MONGODB_URI no definido.\n')
    process.exit(1)
  }

  mongoose
    .connect(MONGODB_URI as string)
    .then(async () => {
      if (doDiffOnly) {
        await runDiffReport()
      } else {
        await runMigration({ write: doWrite })
      }
    })
    .then(() => mongoose.disconnect())
    .then(() => process.exit(0))
    .catch((err: unknown) => {
      logger.error('[migrate:v2] ERROR:', err)
      process.exit(1)
    })
}
