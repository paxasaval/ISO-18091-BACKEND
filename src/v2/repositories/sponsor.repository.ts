// Repositorio v2 de Sponsor (coleccion sponsor.model).
import Sponsor from '../models/sponsor.model'
import BaseRepository, { ModelDocType } from './base.repository'

type SponsorDoc = ModelDocType<typeof Sponsor>

export class SponsorRepository extends BaseRepository<SponsorDoc> {
  constructor() {
    super(Sponsor)
  }
}

export const sponsorRepository = new SponsorRepository()
export default sponsorRepository
