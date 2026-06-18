// Repositorio de Gad (controllers/gad.js).
import mongoose from 'mongoose'
import Gad from '../../models/gad'
// Modelo Report en CommonJS (export =); usado por PUT /newReport.
import Report from '../../models/report'
import BaseRepository, { ModelDocType } from './base.repository'

type GadDoc = ModelDocType<typeof Gad>
type ReportDoc = ModelDocType<typeof Report>

export interface ReportInput {
  source: string
  period: string
  info: unknown[]
}

export class GadRepository extends BaseRepository<GadDoc> {
  constructor() {
    super(Gad)
  }

  // GET /reportDefault -> Gad.findById(gadID).populate('reportDefault')
  async findByIdWithReportDefault(id: string): Promise<GadDoc | null> {
    return this.findById(id, { populate: 'reportDefault' })
  }

  // GET /reports -> Gad.findById(gadID).populate('report')
  async findByIdWithReports(id: string): Promise<GadDoc | null> {
    return this.findById(id, { populate: 'report' })
  }

  // PUT /newReport: crea el Report y lo agrega al gad.
  // Replica EXACTO el legacy: new Report().save(), concat del report formateado
  // sobre gadBD.report y findByIdAndUpdate(gadID, gadBD, { new:true }).
  async createReport(data: ReportInput): Promise<ReportDoc> {
    const report = new Report({
      source: data.source,
      period: data.period,
      info: data.info
    })
    return report.save()
  }

  async addReportToGad(gadID: string, report: ReportDoc): Promise<GadDoc | null> {
    const gadBD = await Gad.findById(gadID)
    if (!gadBD) {
      return null
    }
    // Legacy: concat del report formateado; Mongoose castea el objeto a su _id
    // en el array de refs. Concatenar el _id produce el MISMO resultado guardado.
    gadBD.report = gadBD.report.concat(report._id as mongoose.Types.ObjectId)
    return Gad.findByIdAndUpdate(gadID, gadBD, { new: true }).exec()
  }

  // PUT /updateConfig: setea reportDefault (ObjectId) y publishAuto.
  async updateConfig(
    gadID: string,
    reportDefault: string,
    publishAuto: boolean
  ): Promise<GadDoc | null> {
    const gadBD = await Gad.findById(gadID)
    if (!gadBD) {
      return null
    }
    gadBD.reportDefault = new mongoose.Types.ObjectId(reportDefault)
    gadBD.publishAuto = publishAuto
    return Gad.findByIdAndUpdate(gadID, gadBD, { new: true }).exec()
  }
}

export const gadRepository = new GadRepository()
export default gadRepository
