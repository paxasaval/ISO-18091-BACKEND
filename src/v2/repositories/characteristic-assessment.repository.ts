// Repositorio v2 de CharacteristicAssessment (coleccion characteristic-assessment.model).
import CharacteristicAssessment from '../models/characteristic-assessment.model'
import BaseRepository, { ModelDocType } from './base.repository'

type CharacteristicAssessmentDoc = ModelDocType<typeof CharacteristicAssessment>

export class CharacteristicAssessmentRepository extends BaseRepository<CharacteristicAssessmentDoc> {
  constructor() {
    super(CharacteristicAssessment)
  }
}

export const characteristicAssessmentRepository = new CharacteristicAssessmentRepository()
export default characteristicAssessmentRepository
