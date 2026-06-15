// Repositorio v2 de Gad (coleccion gad.model).
import Gad from '../models/gad.model'
import BaseRepository, { ModelDocType } from './base.repository'

type GadDoc = ModelDocType<typeof Gad>

export class GadRepository extends BaseRepository<GadDoc> {
  constructor() {
    super(Gad)
  }
}

export const gadRepository = new GadRepository()
export default gadRepository
