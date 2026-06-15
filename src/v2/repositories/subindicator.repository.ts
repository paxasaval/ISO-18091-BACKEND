// Repositorio v2 de Subindicator (coleccion subindicator.model).
import Subindicator from '../models/subindicator.model'
import BaseRepository, { ModelDocType } from './base.repository'

type SubindicatorDoc = ModelDocType<typeof Subindicator>

export class SubindicatorRepository extends BaseRepository<SubindicatorDoc> {
  constructor() {
    super(Subindicator)
  }
}

export const subindicatorRepository = new SubindicatorRepository()
export default subindicatorRepository
