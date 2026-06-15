// Repositorio v2 de Report (coleccion report.model).
import Report from '../models/report.model'
import BaseRepository, { ModelDocType } from './base.repository'

type ReportDoc = ModelDocType<typeof Report>

export class ReportRepository extends BaseRepository<ReportDoc> {
  constructor() {
    super(Report)
  }
}

export const reportRepository = new ReportRepository()
export default reportRepository
