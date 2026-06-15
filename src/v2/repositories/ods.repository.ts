// Repositorio v2 de Ods (coleccion ods.model).
import Ods from '../models/ods.model'
import BaseRepository, { ModelDocType } from './base.repository'

type OdsDoc = ModelDocType<typeof Ods>

export class OdsRepository extends BaseRepository<OdsDoc> {
  constructor() {
    super(Ods)
  }
}

export const odsRepository = new OdsRepository()
export default odsRepository
