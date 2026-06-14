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

  // POST /addValuationArray -> findByIdAndUpdate(id, { valuation }, { new:true })
  async updateValuation(
    id: string,
    valuation: CharacteristicDoc['valuation']
  ): Promise<CharacteristicDoc | null> {
    return this.updateById(id, { valuation })
  }

  // POST /changeType -> findByIdAndUpdate(id, { type }, { new:true })
  async updateType(id: string, type: unknown): Promise<CharacteristicDoc | null> {
    return this.updateById(id, { type } as Record<string, unknown>)
  }

  // POST /changeFormat -> findByIdAndUpdate(id, { format }, { new:true })
  async updateFormat(id: string, format: unknown): Promise<CharacteristicDoc | null> {
    return this.updateById(id, { format } as Record<string, unknown>)
  }

  // POST /addExtra -> findByIdAndUpdate(id, { extras }, { new:true })
  async updateExtras(id: string, extras: unknown): Promise<CharacteristicDoc | null> {
    return this.updateById(id, { extras } as Record<string, unknown>)
  }
}

export const characteristicRepository = new CharacteristicRepository()
export default characteristicRepository
