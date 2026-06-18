// Repositorio v2 de SourceDocument (coleccion source-document.model).
import SourceDocument from '../models/source-document.model'
import BaseRepository, { ModelDocType } from './base.repository'

type SourceDocumentDoc = ModelDocType<typeof SourceDocument>

export class SourceDocumentRepository extends BaseRepository<SourceDocumentDoc> {
  constructor() {
    super(SourceDocument)
  }
}

export const sourceDocumentRepository = new SourceDocumentRepository()
export default sourceDocumentRepository
