// Repositorio de Type (controllers/type.js).
import Type from '../../models/type'
import BaseRepository, { ModelDocType } from './base.repository'

type TypeDoc = ModelDocType<typeof Type>

export class TypeRepository extends BaseRepository<TypeDoc> {
  constructor() {
    super(Type)
  }

  // GET / -> Type.find({}).populate('characteristics')
  async findAllWithCharacteristics(): Promise<TypeDoc[]> {
    return this.findAll({}, { populate: 'characteristics' })
  }

  // GET /?mandatory=true|false -> Type.find({ mandatory }).populate('characteristics')
  async findByMandatory(mandatory: boolean): Promise<TypeDoc[]> {
    return this.findAll(
      { mandatory } as Record<string, unknown>,
      { populate: 'characteristics' }
    )
  }

  // GET /:id -> Type.findById(id).populate('characteristics')
  async findByIdWithCharacteristics(id: string): Promise<TypeDoc | null> {
    return this.findById(id, { populate: 'characteristics' })
  }
}

export const typeRepository = new TypeRepository()
export default typeRepository
