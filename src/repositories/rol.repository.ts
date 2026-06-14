// Repositorio de Rol. CRUD generico (controllers/rol.js).
// Tambien lo usa la capa de auth para resolver el rol del token.
import Rol from '../../models/rol'
import BaseRepository, { ModelDocType } from './base.repository'

type RolDoc = ModelDocType<typeof Rol>

export class RolRepository extends BaseRepository<RolDoc> {
  constructor() {
    super(Rol)
  }
}

export const rolRepository = new RolRepository()
export default rolRepository
