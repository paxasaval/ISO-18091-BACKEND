import mongoose, { Document, PaginateModel, Schema } from 'mongoose'
import mongoosePaginate = require('mongoose-paginate-v2')

interface ISubIndicator extends Document {
  typeID: mongoose.Types.ObjectId
  indicadorID: mongoose.Types.ObjectId
  name: string
  requireCover: boolean
  cover?: string
  observationCover?: string
  isPlanned?: boolean
  isDiagnosed?: boolean
  responsible: string
  qualification: number
  score: number
  totalScore: number
  autoQualification: number
  lastUpdate?: Date
  lastUpdateBy?: mongoose.Types.ObjectId
  state: boolean
  created: Date
  createdBy: mongoose.Types.ObjectId
  commits: mongoose.Types.ObjectId[]
  evidences: mongoose.Types.ObjectId[]
  extraInfo: unknown
}

const subIndicadorSchema = new Schema<ISubIndicator>({
  typeID: {
    type: Schema.Types.ObjectId,
    ref: 'Type',
    required: true
  },
  indicadorID: {
    type: Schema.Types.ObjectId,
    ref: 'IndicatorInstance',
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
  responsible: {
    type: String,
    required: true
  },
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
  lastUpdate: {
    type: Date,
    required: false
  },
  lastUpdateBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
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
    ref: 'User',
    required: true
  },
  commits: [{
    type: Schema.Types.ObjectId,
    ref: 'Commit'
  }],
  evidences: [{
    type: Schema.Types.ObjectId,
    ref: 'Evidence'
  }],
  extraInfo: {
    type: Schema.Types.Mixed,
    required: false,
    default: {}
  }
})

subIndicadorSchema.plugin(mongoosePaginate)

subIndicadorSchema.set('toJSON', {
  transform: (doc, returnObj) => {
    returnObj.id = returnObj._id.toString()
    delete returnObj._id
    delete returnObj.__v
  }
})

export = mongoose.model<ISubIndicator, PaginateModel<ISubIndicator>>('SubIndicator', subIndicadorSchema)
