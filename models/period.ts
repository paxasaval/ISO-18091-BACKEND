import mongoose, { Document, Schema } from 'mongoose'

interface IPeriod extends Document {
  year: string
  gad: mongoose.Types.ObjectId
  createdBy: mongoose.Types.ObjectId
}

const periodSchema = new Schema<IPeriod>({
  year: {
    type: String,
    required: true
  },
  gad: {
    type: Schema.Types.ObjectId,
    ref: 'gad',
    required: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true
  }
})
periodSchema.set('toJSON', {
  transform: (doc, returnObj) => {
    returnObj.id = returnObj._id.toString()
    delete returnObj._id
    delete returnObj.__v
  }
})

export = mongoose.model<IPeriod>('Period', periodSchema)
