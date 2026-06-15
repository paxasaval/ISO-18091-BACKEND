// Repositorio v2 de Period (coleccion period.model).
import Period from '../models/period.model'
import BaseRepository, { ModelDocType } from './base.repository'

type PeriodDoc = ModelDocType<typeof Period>

export class PeriodRepository extends BaseRepository<PeriodDoc> {
  constructor() {
    super(Period)
  }
}

export const periodRepository = new PeriodRepository()
export default periodRepository
