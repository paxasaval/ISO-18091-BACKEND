// Repositorio v2 de IndicatorInstance (coleccion indicator-instance.model).
import IndicatorInstance from '../models/indicator-instance.model'
import BaseRepository, { ModelDocType } from './base.repository'

type IndicatorInstanceDoc = ModelDocType<typeof IndicatorInstance>

export class IndicatorInstanceRepository extends BaseRepository<IndicatorInstanceDoc> {
  constructor() {
    super(IndicatorInstance)
  }
}

export const indicatorInstanceRepository = new IndicatorInstanceRepository()
export default indicatorInstanceRepository
