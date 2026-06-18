// Repositorio v2 de Rol (coleccion rol.model).
import Rol from '../models/rol.model'
import BaseRepository, { ModelDocType } from './base.repository'

type RolDoc = ModelDocType<typeof Rol>

export class RolRepository extends BaseRepository<RolDoc> {
  constructor() {
    super(Rol)
  }
}

export const rolRepository = new RolRepository()
export default rolRepository
