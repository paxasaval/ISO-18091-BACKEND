// Repositorio v2 de Type (coleccion type.model).
import Type from '../models/type.model'
import BaseRepository, { ModelDocType } from './base.repository'

type TypeDoc = ModelDocType<typeof Type>

export class TypeRepository extends BaseRepository<TypeDoc> {
  constructor() {
    super(Type)
  }
}

export const typeRepository = new TypeRepository()
export default typeRepository
