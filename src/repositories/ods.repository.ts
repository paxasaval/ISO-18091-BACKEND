// Repositorio de Ods. CRUD generico (controllers/ods.js).
import Ods from '../../models/ods'
import BaseRepository, { ModelDocType } from './base.repository'

type OdsDoc = ModelDocType<typeof Ods>

export class OdsRepository extends BaseRepository<OdsDoc> {
  constructor() {
    super(Ods)
  }
}

export const odsRepository = new OdsRepository()
export default odsRepository
