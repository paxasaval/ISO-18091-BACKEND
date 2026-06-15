// Entidad NUEVA v2: SourceDocument. Coleccion 'v2_source_documents'.
// Biblioteca POA reutilizable a nivel GAD/periodo: el documento se sube una vez
// y se referencia desde multiples evidencias (Evidence.sourceId).
import mongoose, { Document, Schema } from 'mongoose'

interface ISourceDocumentV2 extends Document {
  gadId: mongoose.Types.ObjectId
  periodId?: mongoose.Types.ObjectId
  year?: string
  name: string
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
