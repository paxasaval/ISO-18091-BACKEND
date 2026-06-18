// Modelo v2 de Subindicator. Coleccion 'v2_subindicators'.
// Renombres: typeID->typeId, indicadorID->indicatorInstanceId,
// responsible->responsibleText.
// Nuevos: responsibleUserIds[] (relacion a usuarios), maturityLevel (RESERVADO).
// Conserva qualification/score/totalScore/autoQualification.
import mongoose, { Document, PaginateModel, Schema } from 'mongoose'
import mongoosePaginate = require('mongoose-paginate-v2')

interface ISubindicatorV2 extends Document {
  typeId: mongoose.Types.ObjectId
  indicatorInstanceId: mongoose.Types.ObjectId
  name: string
  requireCover: boolean
  cover?: string
  observationCover?: string
  isPlanned?: boolean
  isDiagnosed?: boolean
  responsibleText?: string
  responsibleUserIds: mongoose.Types.ObjectId[]
  qualification: number
  score: number
  totalScore: number
  autoQualification: number
  maturityLevel?: number
  lastUpdate?: Date
  lastUpdateBy?: mongoose.Types.ObjectId
  state: boolean
  created: Date
  createdBy: mongoose.Types.ObjectId
  commits: mongoose.Types.ObjectId[]
  evidences: mongoose.Types.ObjectId[]
  extraInfo: unknown
}

const subindicatorSchema = new Schema<ISubindicatorV2>({
  typeId: {
    type: Schema.Types.ObjectId,
    ref: 'TypeV2',
    required: true
  },
  indicatorInstanceId: {
    type: Schema.Types.ObjectId,
    ref: 'IndicatorInstanceV2',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  requireCover: {
    type: Boolean,
    required: true
  },
  cover: {
    type: String,
    required: false
  },
  observationCover: {
    type: String,
    required: false
  },
  isPlanned: {
    type: Boolean,
    required: false
  },
  isDiagnosed: {
    type: Boolean,
    required: false
  },
  responsibleText: {
    type: String,
    required: false
  },
  responsibleUserIds: [{
    type: Schema.Types.ObjectId,
    ref: 'UserV2',
    required: false,
    default: []
  }],
  qualification: {
    type: Number,
    default: 0,
    required: false
  },
  score: {
    type: Number,
    default: 0,
    required: false
  },
  totalScore: {
    type: Number,
    default: 0,
    required: false
  },
  autoQualification: {
    type: Number,
    default: 0,
    required: false
  },
  maturityLevel: {
    type: Number,
    required: false
  },
  lastUpdate: {
    type: Date,
    required: false
  },
  lastUpdateBy: {
    type: Schema.Types.ObjectId,
    ref: 'UserV2',
    required: false
  },
  state: {
    type: Boolean,
    required: true
  },
  created: {
    type: Date,
    required: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'UserV2',
    required: true
  },
  commits: [{
    type: Schema.Types.ObjectId,
    ref: 'CommitV2'
  }],
  evidences: [{
    type: Schema.Types.ObjectId,
    ref: 'EvidenceV2'
  }],
  extraInfo: {
    type: Schema.Types.Mixed,
    required: false,
    default: {}
  }
})

subindicatorSchema.plugin(mongoosePaginate)

subindicatorSchema.set('toJSON', {
  transform: (doc, returnObj) => {
    if (returnObj._id) {
      returnObj.id = returnObj._id.toString()
      delete returnObj._id
      delete returnObj.__v
    }
  }
})

export = mongoose.model<ISubindicatorV2, PaginateModel<ISubindicatorV2>>(
  'SubindicatorV2',
  subindicatorSchema,
  'v2_subindicators'
)
