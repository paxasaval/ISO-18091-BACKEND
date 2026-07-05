// Repositorio v2 de User (coleccion user.model).
import User from '../models/user.model'
import BaseRepository, { ModelDocType } from './base.repository'

type UserDoc = ModelDocType<typeof User>

export class UserRepository extends BaseRepository<UserDoc> {
  constructor() {
    super(User)
  }

  // GET /:id -> User.findById(id).populate('rol')
  async findByIdWithRol(id: string): Promise<UserDoc | null> {
    return this.findById(id, { populate: 'rol' })
  }

  // Login v2 -> User.findOne({ email }). El campo password tiene select:true en
  // el esquema, asi que viene incluido para comparar el hash con bcrypt.
  async findByEmail(email: string): Promise<UserDoc | null> {
    return this.findOne({ email } as Record<string, unknown>)
  }
}

export const userRepository = new UserRepository()
export default userRepository
