// Repositorio de Rubric. CRUD generico (models/rubric.ts).
import Rubric from '../../models/rubric'
import BaseRepository, { ModelDocType } from './base.repository'

type RubricDoc = ModelDocType<typeof Rubric>

export class RubricRepository extends BaseRepository<RubricDoc> {
  constructor() {
    super(Rubric)
  }
}

export const rubricRepository = new RubricRepository()
export default rubricRepository
