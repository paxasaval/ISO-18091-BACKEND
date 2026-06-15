// Repositorio v2 de Characteristic (coleccion characteristic.model).
import Characteristic from '../models/characteristic.model'
import BaseRepository, { ModelDocType } from './base.repository'

type CharacteristicDoc = ModelDocType<typeof Characteristic>

export class CharacteristicRepository extends BaseRepository<CharacteristicDoc> {
  constructor() {
    super(Characteristic)
  }
}

export const characteristicRepository = new CharacteristicRepository()
export default characteristicRepository
