// Repositorio de User (controllers/user.js).
import { Types } from 'mongoose'
import User from '../../models/users'
import BaseRepository, { ModelDocType } from './base.repository'

type UserDoc = ModelDocType<typeof User>

export class UserRepository extends BaseRepository<UserDoc> {
  constructor() {
    super(User)
  }

  // GET / (con header tenant) -> User.find({ gadID: tenantID }).populate('rol')
  async findByTenant(tenantID: string): Promise<UserDoc[]> {
    return this.findAll(
      { gadID: new Types.ObjectId(tenantID) } as Record<string, unknown>,
      { populate: 'rol' }
    )
  }

  // GET /:id -> User.findById(id).populate('rol')
  async findByIdWithRol(id: string): Promise<UserDoc | null> {
    return this.findById(id, { populate: 'rol' })
  }

  // notify (utils/middleware.js): User.find({ gadID, rol: ROL_ADMIN_KEY })
  async findAdminsByTenant(
    gadID: unknown,
    rol: string | undefined
  ): Promise<UserDoc[]> {
    return this.findAll({ gadID, rol } as Record<string, unknown>)
  }

  // POST /password y login -> User.findOne({ mail })
  // Nota: el campo password tiene select:true en el esquema, asi que viene incluido.
  async findByMail(mail: string): Promise<UserDoc | null> {
    return this.findOne({ mail } as Record<string, unknown>)
  }
}

export const userRepository = new UserRepository()
export default userRepository
