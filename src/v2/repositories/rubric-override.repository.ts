// Repositorio v2 de RubricOverride (coleccion rubric-override.model).
import RubricOverride from '../models/rubric-override.model'
import BaseRepository, { ModelDocType } from './base.repository'

type RubricOverrideDoc = ModelDocType<typeof RubricOverride>

export class RubricOverrideRepository extends BaseRepository<RubricOverrideDoc> {
  constructor() {
    super(RubricOverride)
  }
}

export const rubricOverrideRepository = new RubricOverrideRepository()
export default rubricOverrideRepository
