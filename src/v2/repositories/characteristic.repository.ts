// Repositorio v2 de Characteristic (coleccion characteristic.model).
// Nombres limpios: valuations (antes valuation), allowedFormats (antes
// allowed_formats), inputKind (reemplaza el type===2 numerico).
import Characteristic from '../models/characteristic.model'
import BaseRepository, { ModelDocType } from './base.repository'

type CharacteristicDoc = ModelDocType<typeof Characteristic>

export class CharacteristicRepository extends BaseRepository<CharacteristicDoc> {
  constructor() {
    super(Characteristic)
  }

  // GET /:id -> Characteristic.findById(id).populate('valuations')
  async findByIdWithValuations(id: string): Promise<CharacteristicDoc | null> {
    return this.findById(id, { populate: 'valuations' })
  }

  // PATCH /:id/valuation -> findByIdAndUpdate(id, { valuations }, { new:true })
  async updateValuations(
    id: string,
    valuations: CharacteristicDoc['valuations']
  ): Promise<CharacteristicDoc | null> {
    return this.updateById(id, { valuations })
  }

  // PATCH /:id/inputKind -> findByIdAndUpdate(id, { inputKind }, { new:true })
  async updateInputKind(
    id: string,
    inputKind: CharacteristicDoc['inputKind']
  ): Promise<CharacteristicDoc | null> {
    return this.updateById(id, { inputKind } as Record<string, unknown>)
  }

  // PATCH /:id/format -> findByIdAndUpdate(id, { format }, { new:true })
  async updateFormat(
    id: string,
    format: unknown
  ): Promise<CharacteristicDoc | null> {
    return this.updateById(id, { format } as Record<string, unknown>)
  }

  // PATCH /:id/extras -> findByIdAndUpdate(id, { extras }, { new:true })
  async updateExtras(
    id: string,
    extras: unknown
  ): Promise<CharacteristicDoc | null> {
    return this.updateById(id, { extras } as Record<string, unknown>)
  }
}

export const characteristicRepository = new CharacteristicRepository()
export default characteristicRepository
