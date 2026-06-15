// Repositorio de News. CRUD generico (models/news.ts).
import News from '../../models/news'
import BaseRepository, { ModelDocType } from './base.repository'

type NewsDoc = ModelDocType<typeof News>

export class NewsRepository extends BaseRepository<NewsDoc> {
  constructor() {
    super(News)
  }
}

export const newsRepository = new NewsRepository()
export default newsRepository
