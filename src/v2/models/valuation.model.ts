// Modelo v2 de Valuation. Coleccion 'v2_valuations'.
// maxValue se mantiene (sera el peso del criterio en el scoring v2).
import mongoose, { Document, Schema } from 'mongoose'

interface IValuationV2 extends Document {
  name: string
  category: string
  maxValue: number
  slug?: string
  order?: number
}

const valuationSchema = new Schema<IValuationV2>({
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  maxValue: {
    type: Number,
    required: true
  },
  slug: {
    type: String,
    required: false
  },
  order: {
    type: Number,
    required: false
  }
})

valuationSchema.set('toJSON', {
  transform: (doc, returnObj) => {
    if (returnObj._id) {
      returnObj.id = returnObj._id.toString()
      delete returnObj._id
      delete returnObj.__v
    }
  }
})

export = mongoose.model<IValuationV2>('ValuationV2', valuationSchema, 'v2_valuations')
