// Repositorio de Sponsor. CRUD generico (models/sponsors.ts).
import Sponsor from '../../models/sponsors'
import BaseRepository, { ModelDocType } from './base.repository'

type SponsorDoc = ModelDocType<typeof Sponsor>

export class SponsorRepository extends BaseRepository<SponsorDoc> {
  constructor() {
    super(Sponsor)
  }
}

export const sponsorRepository = new SponsorRepository()
export default sponsorRepository
