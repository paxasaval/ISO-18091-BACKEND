// Modelo v2 de Ods. Coleccion 'v2_ods'.
import mongoose, { Document, Schema } from 'mongoose'

interface IOdsV2 extends Document {
  number: number
  name: string
  img: string
  slug?: string
  order?: number
}

const odsSchema = new Schema<IOdsV2>({
  number: Number,
  name: String,
  img: String,
  slug: {
    type: String,
    required: false
  },
  order: {
    type: Number,
    required: false
  }
})

odsSchema.set('toJSON', {
  transform: (doc, returnObj) => {
    if (returnObj._id) {
      returnObj.id = returnObj._id.toString()
      delete returnObj._id
      delete returnObj.__v
    }
  }
})

export = mongoose.model<IOdsV2>('OdsV2', odsSchema, 'v2_ods')
