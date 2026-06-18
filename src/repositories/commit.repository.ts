// Repositorio de Commit. CRUD generico (controllers/commit.js).
import Commit from '../../models/commit'
import BaseRepository, { ModelDocType } from './base.repository'

type CommitDoc = ModelDocType<typeof Commit>

export class CommitRepository extends BaseRepository<CommitDoc> {
  constructor() {
    super(Commit)
  }
}

export const commitRepository = new CommitRepository()
export default commitRepository
