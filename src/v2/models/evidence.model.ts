// Modelo v2 de Evidence. Coleccion 'v2_evidences'.
// Renombres: characteristicID->characteristicId, subIndicatorID->subindicatorId,
// qualificationBy->qualifiedBy (alineado), author ya limpio.
// Nuevos: kind ('principal'|'complementaria'), sourceId (ref SourceDocumentV2),
// pages (rango "12-15").
// QUITADO: rubric (la rubrica pasa a CharacteristicAssessment, por caracteristica).
import mongoose, { Document, Schema } from 'mongoose'

interface IContentV2 {
  part: string
  key: boolean
}

interface IEvidenceV2 extends Document {
  characteristicId: mongoose.Types.ObjectId
  subindicatorId: mongoose.Types.ObjectId
  name: string
  link: string
  note?: string
  content: IContentV2[]
  state?: boolean
  verified: boolean
  qualification?: number
  totalRubric?: number
  qualificationBy?: mongoose.Types.ObjectId
  qualificationDate?: Date
  author: mongoose.Types.ObjectId
  commits: mongoose.Types.ObjectId[]
  kind: 'principal' | 'complementaria'
  sourceId?: mongoose.Types.ObjectId
  pages?: string
  extras: unknown
}

const contentSchema = new Schema<IContentV2>({
  part: {
    type: String,
    required: true
  },
  key: {
    type: Boolean,
    required: true
  }
})

const evidenceSchema = new Schema<IEvidenceV2>({
  characteristicId: {
    type: Schema.Types.ObjectId,
    ref: 'CharacteristicV2',
    required: true
  },
  subindicatorId: {
    type: Schema.Types.ObjectId,
    ref: 'SubindicatorV2',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  link: {
    type: String,
    required: false
  },
  note: {
    type: String,
    required: false
  },
  content: [{
    type: contentSchema,
    required: false
  }],
  state: {
    type: Boolean,
    required: false
  },
  verified: {
    type: Boolean,
    default: false
  },
  qualification: {
    type: Number,
    required: false
  },
  totalRubric: {
    type: Number,
    required: false
  },
  qualificationBy: {
    type: Schema.Types.ObjectId,
    ref: 'UserV2',
    required: false
  },
  qualificationDate: {
    type: Date,
    required: false
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'UserV2',
    required: true
  },
  commits: [{
    type: Schema.Types.ObjectId,
    ref: 'CommitV2',
    required: false
  }],
  kind: {
    type: String,
    enum: ['principal', 'complementaria'],
    default: 'principal'
  },
  sourceId: {
    type: Schema.Types.ObjectId,
    ref: 'SourceDocumentV2',
    required: false
  },
  pages: {
    type: String,
    required: false
  },
  extras: {
    type: Schema.Types.Mixed,
    required: false,
    default: {}
  }
})

evidenceSchema.set('toJSON', {
  transform: (doc, returnObj) => {
    if (returnObj._id) {
      returnObj.id = returnObj._id.toString()
      delete returnObj._id
      delete returnObj.__v
    }
  }
})

export = mongoose.model<IEvidenceV2>('EvidenceV2', evidenceSchema, 'v2_evidences')
