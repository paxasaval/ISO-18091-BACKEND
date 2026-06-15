// Repositorio v2 de Evidence (coleccion evidence.model).
import Evidence from '../models/evidence.model'
import BaseRepository, { ModelDocType } from './base.repository'

type EvidenceDoc = ModelDocType<typeof Evidence>

export class EvidenceRepository extends BaseRepository<EvidenceDoc> {
  constructor() {
    super(Evidence)
  }
}

export const evidenceRepository = new EvidenceRepository()
export default evidenceRepository
