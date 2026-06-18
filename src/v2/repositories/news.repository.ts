// Repositorio v2 de News (coleccion news.model).
import News from '../models/news.model'
import BaseRepository, { ModelDocType } from './base.repository'

type NewsDoc = ModelDocType<typeof News>

export class NewsRepository extends BaseRepository<NewsDoc> {
  constructor() {
    super(News)
  }
}

export const newsRepository = new NewsRepository()
export default newsRepository
