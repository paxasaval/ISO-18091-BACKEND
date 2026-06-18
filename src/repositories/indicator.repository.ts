// Repositorio de Indicator (controllers/indicator.js).
import Indicator from '../../models/indicator'
import BaseRepository, { ModelDocType } from './base.repository'

type IndicatorDoc = ModelDocType<typeof Indicator>

export class IndicatorRepository extends BaseRepository<IndicatorDoc> {
  constructor() {
    super(Indicator)
  }

  // GET / (sin query) -> Indicator.find({}).populate('ods')
  async findAllWithOds(): Promise<IndicatorDoc[]> {
    return this.findAll({}, { populate: 'ods' })
  }

  // GET /?quadrant=... -> Indicator.find({ quadrant }).populate('ods').sort('number')
  async findByQuadrant(quadrant: number): Promise<IndicatorDoc[]> {
    return this.findAll(
      { quadrant } as Record<string, unknown>,
      { populate: 'ods', sort: 'number' }
    )
  }

  // GET /byQuadrantAndNumber -> Indicator.findOne({ quadrant, number }).populate('ods')
  async findByQuadrantAndNumber(
    quadrant: number,
    number: number
  ): Promise<IndicatorDoc | null> {
    return this.findOne(
      { quadrant, number } as Record<string, unknown>,
      { populate: 'ods' }
    )
  }

  // GET /:id -> Indicator.findById(id).populate('ods')
  async findByIdWithOds(id: string): Promise<IndicatorDoc | null> {
    return this.findById(id, { populate: 'ods' })
  }
}

export const indicatorRepository = new IndicatorRepository()
export default indicatorRepository
