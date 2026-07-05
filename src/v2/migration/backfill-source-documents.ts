// ===========================================================================
// Backfill de la biblioteca de documentos fuente (v2_source_documents).
// ===========================================================================
//
// Recorre las evidencias v2 que tienen `link` pero NO tienen `sourceId` y, por
// cada una, crea/enlaza un SourceDocument (dedupe por gadId+link) y setea
// Evidence.sourceId. Deja la biblioteca coherente con los datos ya existentes
// (migrados / de prueba), no solo con las subidas nuevas.
//
// Idempotente: solo procesa evidencias sin sourceId y el service deduplica por
// (gadId, link); correrlo dos veces produce el mismo resultado.
//
// Uso:
//   npm run backfill:sources            -> DRY-RUN (no escribe; solo reporta)
//   npm run backfill:sources -- --write -> escribe en la BD
//
// Requiere IP whitelisteada en Atlas (correr en la maquina del usuario).
// ===========================================================================

import mongoose from 'mongoose'
import Evidence from '../models/evidence.model'
import { findOrCreateSourceForEvidence, resolveSourceContext } from '../services/source-document.service'
import logger from '../../utils/logger'

interface EvidenceLean {
  _id: mongoose.Types.ObjectId
  subindicatorId: mongoose.Types.ObjectId
  name: string
  link?: string
  author?: mongoose.Types.ObjectId
}

export interface BackfillReport {
  candidates: number
  linked: number
  skippedNoContext: number
}

// Ejecuta el backfill sobre la conexion mongoose ACTIVA (sirve para tests con
// mongodb-memory-server y para el CLI contra Atlas). En dry-run solo cuenta.
export const runBackfill = async (
  opts: { write: boolean } = { write: false }
): Promise<BackfillReport> => {
  const evidences = (await Evidence.find({
    link: { $exists: true, $nin: [null, ''] },
    $or: [{ sourceId: { $exists: false } }, { sourceId: null }]
  }).lean()) as unknown as EvidenceLean[]

  const report: BackfillReport = {
    candidates: evidences.length,
    linked: 0,
    skippedNoContext: 0
  }

  for (const ev of evidences) {
    if (!ev.link) {
      report.skippedNoContext += 1
      continue
    }

    if (!opts.write) {
      // Dry-run: solo verifica que se pueda resolver el gad (sin escribir).
      const ctx = await resolveSourceContext(ev.subindicatorId)
      if (ctx) report.linked += 1
      else report.skippedNoContext += 1
      continue
    }

    const sourceId = await findOrCreateSourceForEvidence({
      subindicatorId: ev.subindicatorId,
      name: ev.name,
      link: ev.link,
      uploadedBy: ev.author
    })
    if (!sourceId) {
      report.skippedNoContext += 1
      continue
    }
    await Evidence.updateOne({ _id: ev._id }, { $set: { sourceId } })
    report.linked += 1
  }

  return report
}

// --- CLI ---
// Solo corre si se invoca directamente (no al importarse desde un test).
if (require.main === module) {
  const doWrite = process.argv.includes('--write')

  process.stdout.write(
    doWrite
      ? '[backfill:sources] Modo WRITE: poblando la biblioteca desde las evidencias.\n'
      : '[backfill:sources] DRY-RUN (sin escritura). Usa -- --write para persistir.\n'
  )

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv').config()
  const MONGODB_URI = process.env.MONGODB_URI

  if (!MONGODB_URI) {
    process.stderr.write('[backfill:sources] ERROR: MONGODB_URI no definido.\n')
    process.exit(1)
  }

  mongoose
    .connect(MONGODB_URI)
    .then(() => runBackfill({ write: doWrite }))
    .then((report) => {
      process.stdout.write(
        `[backfill:sources] candidatas=${report.candidates} ` +
        `enlazadas=${report.linked} sin_contexto=${report.skippedNoContext}\n`
      )
      return mongoose.disconnect()
    })
    .then(() => process.exit(0))
    .catch((err: unknown) => {
      logger.error('[backfill:sources] ERROR:', err)
      process.exit(1)
    })
}

export default runBackfill
