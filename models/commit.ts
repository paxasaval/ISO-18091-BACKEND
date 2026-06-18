import mongoose, { Document, Schema } from 'mongoose'

interface ICommit extends Document {
  autor: mongoose.Types.ObjectId
  body: string
  created: Date
  lastUpdate?: Date
}

const commitSchema = new Schema<ICommit>({
  autor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  body: {
    type: String,
    required: true
  },
  created: {
    type: Date,
    required: true
  },
  lastUpdate: {
    type: Date,
    required: false
  }
})
commitSchema.set('toJSON', {
  transform: (doc, returnObj) => {
    returnObj.id = returnObj._id.toString()
    delete returnObj._id
    delete returnObj.__v
  }
})

export = mongoose.model<ICommit>('Commit', commitSchema)
