// Repositorio de Valuation. CRUD generico (controllers/valuation.js).
import Valuation from '../../models/valuation'
import BaseRepository, { ModelDocType } from './base.repository'

type ValuationDoc = ModelDocType<typeof Valuation>

export class ValuationRepository extends BaseRepository<ValuationDoc> {
  constructor() {
    super(Valuation)
  }
}

export const valuationRepository = new ValuationRepository()
export default valuationRepository
