// Repositorio de Evidence (controllers/evidence.js).
import Evidence from '../../models/evidence'
import BaseRepository, { ModelDocType } from './base.repository'

type EvidenceDoc = ModelDocType<typeof Evidence>

export class EvidenceRepository extends BaseRepository<EvidenceDoc> {
  constructor() {
    super(Evidence)
  }

  // GET /subindicatorID/:id
  // -> find({ subIndicatorID: id }).populate('author').populate(commits + autor)
  async findBySubindicator(subIndicatorID: string): Promise<EvidenceDoc[]> {
    return this.findAll(
      { subIndicatorID } as Record<string, unknown>,
      {
        populate: [
          { path: 'author' },
          {
            path: 'commits',
            model: 'Commit',
            populate: { path: 'autor', model: 'User' }
          }
        ]
      }
    )
  }

  // notify itemType=3 (utils/middleware.js): findById(itemID).populate('subIndicatorID')
  async findByIdForNotify(id: string): Promise<EvidenceDoc | null> {
    return this.findById(id, { populate: 'subIndicatorID' })
  }

  // GET /:id -> findById con author, characteristicID, subIndicatorID, commits, rubric
  async findByIdDeep(id: string): Promise<EvidenceDoc | null> {
    return this.findById(id, {
      populate: [
        { path: 'author' },
        { path: 'characteristicID' },
        { path: 'subIndicatorID' },
        { path: 'commits' },
        { path: 'rubric' }
      ]
    })
  }
}

export const evidenceRepository = new EvidenceRepository()
export default evidenceRepository
