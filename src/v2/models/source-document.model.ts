// Entidad NUEVA v2: SourceDocument. Coleccion 'v2_source_documents'.
// Biblioteca POA reutilizable a nivel GAD/periodo: el documento se sube una vez
// y se referencia desde multiples evidencias (Evidence.sourceId).
import mongoose, { Document, Schema } from 'mongoose'
import { normalizeSourceName } from '../utils/source-name'

interface ISourceDocumentV2 extends Document {
  gadId: mongoose.Types.ObjectId
  periodId?: mongoose.Types.ObjectId
  year?: string
  name: string
  // Nombre normalizado (trim + minusculas + colapsar espacios). Se deriva de
  // `name` en el pre-save; es la clave de dedupe de la biblioteca, alineada con
  // la deteccion de duplicados del frontend.
  nameNormalized?: string
  link: string
  kind?: string
  uploadedBy?: mongoose.Types.ObjectId
  verified: boolean
  createdAt: Date
}

const sourceDocumentSchema = new Schema<ISourceDocumentV2>({
  gadId: {
    type: Schema.Types.ObjectId,
    ref: 'GadV2',
    required: true
  },
  periodId: {
    type: Schema.Types.ObjectId,
    ref: 'PeriodV2',
    required: false
  },
  year: {
    type: String,
    required: false
  },
  name: {
    type: String,
    required: true
  },
  nameNormalized: {
    type: String,
    required: false
  },
  link: {
    type: String,
    required: true
  },
  kind: {
    type: String,
    required: false
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'UserV2',
    required: false
  },
  verified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    required: false,
    default: Date.now
  }
})

// Deriva nameNormalized de name en cada save (create incluido). Asi el dedupe
// por (gadId, nameNormalized) es consistente sin depender de quien crea el doc.
sourceDocumentSchema.pre('save', function (next) {
  if (this.isNew || this.isModified('name')) {
    this.nameNormalized = normalizeSourceName(this.name)
  }
  next()
})

// Dedupe/consulta de la biblioteca por GAD + nombre normalizado.
sourceDocumentSchema.index({ gadId: 1, nameNormalized: 1 })

sourceDocumentSchema.set('toJSON', {
  transform: (doc, returnObj) => {
    if (returnObj._id) {
      returnObj.id = returnObj._id.toString()
      delete returnObj._id
      delete returnObj.__v
    }
  }
})

export = mongoose.model<ISourceDocumentV2>(
  'SourceDocumentV2',
  sourceDocumentSchema,
  'v2_source_documents'
)
