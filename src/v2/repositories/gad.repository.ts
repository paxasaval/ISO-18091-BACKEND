// Repositorio v2 de Gad (coleccion gad.model).
import mongoose from 'mongoose'
import Gad from '../models/gad.model'
import Report from '../models/report.model'
import BaseRepository, { ModelDocType } from './base.repository'

type GadDoc = ModelDocType<typeof Gad>
type ReportDoc = ModelDocType<typeof Report>

export interface ReportInput {
  source: string
  period: string
  info: { label: string; data: string }[]
}

export class GadRepository extends BaseRepository<GadDoc> {
  constructor() {
    super(Gad)
  }

  // GET /:id/reports -> Gad.findById(gadID).populate('report')
  async findByIdWithReports(id: string): Promise<GadDoc | null> {
    return this.findById(id, { populate: 'report' })
  }

  // POST /:id/reports: crea el Report (coleccion v2_reports).
  async createReport(data: ReportInput): Promise<ReportDoc> {
    const report = new Report({
      source: data.source,
      period: data.period,
      info: data.info
    })
    return report.save()
  }

  // Enlaza un report ya creado al gad (append al array report).
  async addReportToGad(
    gadID: string,
    report: ReportDoc
  ): Promise<GadDoc | null> {
    const gadBD = await Gad.findById(gadID)
    if (!gadBD) {
      return null
    }
    gadBD.report = gadBD.report.concat(report._id as mongoose.Types.ObjectId)
    return Gad.findByIdAndUpdate(gadID, gadBD, { new: true }).exec()
  }

  // PUT /:id/config: setea reportDefault (ObjectId) y publishAuto.
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
