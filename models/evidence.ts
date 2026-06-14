import mongoose, { Document, Schema } from 'mongoose'

interface IContent {
  part: string
  key: boolean
}

interface IEvidence extends Document {
  characteristicID: mongoose.Types.ObjectId
  subIndicatorID: mongoose.Types.ObjectId
  name: string
  link: string
  note?: string
  content: IContent[]
  state?: boolean
  verified: boolean
  qualification?: number
  rubric: mongoose.Types.ObjectId[]
  totalRubric?: number
  qualificationBy?: mongoose.Types.ObjectId
  qualificationDate?: Date
  author: mongoose.Types.ObjectId
  commits: mongoose.Types.ObjectId[]
  extras: unknown
}

const contentSchema = new Schema<IContent>({
  part: {
    type: String,
    required: true
  },
  key: {
    type: Boolean,
    required: true
  }
})
const evidenceSchema = new Schema<IEvidence>({
  characteristicID: {
    type: Schema.Types.ObjectId,
    ref: 'Characteristic',
    required: true
  },
  subIndicatorID: {
    type: Schema.Types.ObjectId,
    ref: 'SubIndicator',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  link: {
    type: String,
    required: true
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
  rubric: [{
    type: Schema.Types.ObjectId,
    ref: 'Rubric',
    required: false
  }],
  totalRubric: {
    type: Number,
    required: false
  },
  qualificationBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  qualificationDate: {
    type: Date,
    required: false
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  commits: [{
    type: Schema.Types.ObjectId,
    ref: 'Commit',
    required: false
  }],
  extras: {
    type: Schema.Types.Mixed,
    required: false,
    default: {}
  }
})
evidenceSchema.set('toJSON', {
  transform: (doc, returnObj) => {
    returnObj.id = returnObj._id.toString()
    delete returnObj._id
    delete returnObj.__v
  }
})

export = mongoose.model<IEvidence>('Evidence', evidenceSchema)
