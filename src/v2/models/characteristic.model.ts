// Modelo v2 de Characteristic. Coleccion 'v2_characteristics'.
// Renombres: valuation->valuations, allowed_formats->allowedFormats.
// Nuevos: slug/order, inputKind ('file'|'link', reemplaza type===2), isCover
// (portada como flag). Conserva tier.
import mongoose, { Document, Schema } from 'mongoose'

interface ICharacteristicV2 extends Document {
  name: string
  group: string
  groupName: string
  help?: string
  format?: string
  isRequired: boolean
  required: boolean
  score?: number
  tier: number
  unique: boolean
  parts: string[]
  valuations: mongoose.Types.ObjectId[]
  extras: unknown
  allowedFormats: string[]
  inputKind?: 'file' | 'link'
  isCover?: boolean
  slug?: string
  order?: number
}

const characteristicSchema = new Schema<ICharacteristicV2>({
  name: {
    type: String,
    required: true
  },
  group: {
    type: String,
    required: true
  },
  groupName: {
    type: String,
    required: true
  },
  help: {
    type: String,
    required: false
  },
  format: {
    type: String,
    required: false
  },
  isRequired: {
    type: Boolean,
    required: true
  },
  required: {
    type: Boolean,
    required: true
  },
  score: {
    type: Number,
    required: false
  },
  tier: {
    type: Number,
    required: true
  },
  unique: {
    type: Boolean,
    required: true
  },
  parts: [{
    type: String,
    required: false
  }],
  valuations: [{
    type: Schema.Types.ObjectId,
    ref: 'ValuationV2',
    required: true
  }],
  extras: {
    type: Schema.Types.Mixed,
    required: false,
    default: {}
  },
  allowedFormats: [{
    type: String,
    required: false
  }],
  inputKind: {
    type: String,
    enum: ['file', 'link'],
    required: false
  },
  isCover: {
    type: Boolean,
    required: false
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

characteristicSchema.set('toJSON', {
  transform: (doc, returnObj) => {
    if (returnObj._id) {
      returnObj.id = returnObj._id.toString()
      delete returnObj._id
      delete returnObj.__v
    }
  }
})

export = mongoose.model<ICharacteristicV2>(
  'CharacteristicV2',
  characteristicSchema,
  'v2_characteristics'
)
