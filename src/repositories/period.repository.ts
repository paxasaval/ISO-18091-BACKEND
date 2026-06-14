// Repositorio de Period (controllers/period.js).
import { Types } from 'mongoose'
import Period from '../../models/period'
import BaseRepository, { ModelDocType } from './base.repository'

type PeriodDoc = ModelDocType<typeof Period>

export class PeriodRepository extends BaseRepository<PeriodDoc> {
  constructor() {
    super(Period)
  }

  // GET / (con header tenant) -> Period.find({ gad: tenantID })
  async findByTenant(tenantID: string): Promise<PeriodDoc[]> {
    return this.findAll(
      { gad: new Types.ObjectId(tenantID) } as Record<string, unknown>
    )
  }
}

export const periodRepository = new PeriodRepository()
export default periodRepository
