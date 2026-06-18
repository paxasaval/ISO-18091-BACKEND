import mongoose, { Document, Schema } from 'mongoose'

interface IRubric extends Document {
  valuation: mongoose.Types.ObjectId
  qualification: number
  evidence: mongoose.Types.ObjectId
}

const rubricSchema = new Schema<IRubric>({
  valuation: {
    type: Schema.Types.ObjectId,
    ref: 'Valuation',
    required: true
  },
  qualification: {
    type: Number,
    required: true
  },
  evidence: {
    type: Schema.Types.ObjectId,
    ref: 'Evidence',
    required: true
  }
})

rubricSchema.set('toJSON', {
  transform: (doc, returnObj) => {
    if (returnObj._id) {
      returnObj.id = returnObj._id.toString()
      delete returnObj._id
      delete returnObj.__v
    }
  }
})

export = mongoose.model<IRubric>('Rubric', rubricSchema)
