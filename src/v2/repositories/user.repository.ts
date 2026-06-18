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
}

export const userRepository = new UserRepository()
export default userRepository
