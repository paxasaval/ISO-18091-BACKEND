// Repositorio v2 de Commit (coleccion commit.model).
import Commit from '../models/commit.model'
import BaseRepository, { ModelDocType } from './base.repository'

type CommitDoc = ModelDocType<typeof Commit>

export class CommitRepository extends BaseRepository<CommitDoc> {
  constructor() {
    super(Commit)
  }
}

export const commitRepository = new CommitRepository()
export default commitRepository
