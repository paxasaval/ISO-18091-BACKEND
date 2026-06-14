// Repositorio de Characteristic (controllers/characterstic.js).
import Characteristic from '../../models/characteristic'
import BaseRepository, { ModelDocType } from './base.repository'

type CharacteristicDoc = ModelDocType<typeof Characteristic>

export class CharacteristicRepository extends BaseRepository<CharacteristicDoc> {
  constructor() {
    super(Characteristic)
  }

  // GET /?type=... -> Characteristic.find({ typeID: type })
  async findByType(typeID: string): Promise<CharacteristicDoc[]> {
    return this.findAll({ typeID } as Record<string, unknown>)
  }

  // GET /valuation?id=... y POST / (lectura con valuation poblada).
  async findByIdWithValuation(id: string): Promise<CharacteristicDoc | null> {
    return this.findById(id, { populate: 'valuation' })
  }
}

export const characteristicRepository = new CharacteristicRepository()
export default characteristicRepository
