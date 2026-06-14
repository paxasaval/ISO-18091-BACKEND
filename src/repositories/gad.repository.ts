// Repositorio de Gad (controllers/gad.js).
import Gad from '../../models/gad'
import BaseRepository, { ModelDocType } from './base.repository'

type GadDoc = ModelDocType<typeof Gad>

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
}

export const gadRepository = new GadRepository()
export default gadRepository
