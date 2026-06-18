// Modelo v2 de News. Coleccion 'v2_news'.
import mongoose, { Document, Schema } from 'mongoose'

interface INewsV2 extends Document {
  image: string
  title: string
  description: string
  tag: string[]
  author: mongoose.Types.ObjectId
  gad: mongoose.Types.ObjectId
}

const newsSchema = new Schema<INewsV2>({
  image: {
    type: String,
    required: false
  },
  title: {
    type: String,
    required: false
  },
  description: {
    type: String,
    required: false
  },
  tag: [{
    type: String,
    required: false
  }],
  author: {
    type: Schema.Types.ObjectId,
    ref: 'UserV2',
    required: true
  },
  gad: {
    type: Schema.Types.ObjectId,
    ref: 'GadV2',
    required: true
  }
})

newsSchema.set('toJSON', {
  transform: (doc, returnObj) => {
    if (returnObj._id) {
      returnObj.id = returnObj._id.toString()
      delete returnObj._id
      delete returnObj.__v
    }
  }
})

export = mongoose.model<INewsV2>('NewsV2', newsSchema, 'v2_news')
