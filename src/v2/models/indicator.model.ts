// Modelo v2 de Indicator (catalogo). Coleccion 'v2_indicators'.
import mongoose, { Document, Schema } from 'mongoose'

interface IIndicatorV2 extends Document {
  name: string
  description: string
  number: number
  quadrant: number
  quadrantName: string
  red: string
  yellow: string
  green: string
  ods: mongoose.Types.ObjectId[]
  slug?: string
  order?: number
}

const indicatorSchema = new Schema<IIndicatorV2>({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  number: {
    type: Number,
    required: true
  },
  quadrant: {
    type: Number,
    required: true
  },
  quadrantName: {
    type: String,
    required: true
  },
  red: {
    type: String,
    required: true
  },
  yellow: {
    type: String,
    required: true
  },
  green: {
    type: String,
    required: true
  },
  ods: [{
    type: Schema.Types.ObjectId,
    ref: 'OdsV2'
  }],
  slug: {
    type: String,
    required: false
  },
  order: {
    type: Number,
    required: false
  }
})

indicatorSchema.set('toJSON', {
  transform: (doc, returnObj) => {
    if (returnObj._id) {
      returnObj.id = returnObj._id.toString()
      delete returnObj._id
      delete returnObj.__v
    }
  }
})

export = mongoose.model<IIndicatorV2>('IndicatorV2', indicatorSchema, 'v2_indicators')
