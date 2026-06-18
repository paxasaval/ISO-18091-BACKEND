// Repositorio v2 de Indicator (coleccion indicator.model).
import Indicator from '../models/indicator.model'
import BaseRepository, { ModelDocType } from './base.repository'

type IndicatorDoc = ModelDocType<typeof Indicator>

export class IndicatorRepository extends BaseRepository<IndicatorDoc> {
  constructor() {
    super(Indicator)
  }

  // GET /:id -> Indicator.findById(id).populate('ods')
  async findByIdWithOds(id: string): Promise<IndicatorDoc | null> {
    return this.findById(id, { populate: 'ods' })
  }
}

export const indicatorRepository = new IndicatorRepository()
export default indicatorRepository
