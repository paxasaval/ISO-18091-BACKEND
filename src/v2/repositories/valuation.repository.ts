// Repositorio v2 de Valuation (coleccion valuation.model).
import Valuation from '../models/valuation.model'
import BaseRepository, { ModelDocType } from './base.repository'

type ValuationDoc = ModelDocType<typeof Valuation>

export class ValuationRepository extends BaseRepository<ValuationDoc> {
  constructor() {
    super(Valuation)
  }
}

export const valuationRepository = new ValuationRepository()
export default valuationRepository
