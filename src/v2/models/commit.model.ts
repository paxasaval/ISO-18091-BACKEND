// Modelo v2 de Commit. Coleccion 'v2_commits'.
// Renombre: autor->author.
import mongoose, { Document, Schema } from 'mongoose'

interface ICommitV2 extends Document {
  author: mongoose.Types.ObjectId
  body: string
  created: Date
  lastUpdate?: Date
}

const commitSchema = new Schema<ICommitV2>({
  author: {
    type: Schema.Types.ObjectId,
    ref: 'UserV2',
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
    if (returnObj._id) {
      returnObj.id = returnObj._id.toString()
      delete returnObj._id
      delete returnObj.__v
    }
  }
})

export = mongoose.model<ICommitV2>('CommitV2', commitSchema, 'v2_commits')
