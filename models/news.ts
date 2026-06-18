import mongoose, { Document, Schema } from 'mongoose'

interface INew extends Document {
  image: string
  title: string
  description: string
  tag: string[]
  author: mongoose.Types.ObjectId
  gad: mongoose.Types.ObjectId
}

const newsSchema = new Schema<INew>({
  image: {
    type: String,
    requred: true
  },
  title: {
    type: String,
    requred: true
  },
  description: {
    type: String,
    requred: true
  },
  tag: [{
    type: String,
    requred: true
  }],
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  gad: {
    type: Schema.Types.ObjectId,
    ref: 'Gad',
    required: true
  }
})
newsSchema.set('toJSON', {
  transform: (doc, returnObj) => {
    returnObj.id = returnObj._id.toString()
    delete returnObj._id
    delete returnObj.__v
  }
})

export = mongoose.model<INew>('New', newsSchema)
