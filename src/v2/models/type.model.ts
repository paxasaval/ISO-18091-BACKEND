// Modelo v2 de Type. Coleccion propia 'v2_types' (no colisiona con v1 'types').
// Nombres limpios + campos de presentacion (slug/order).
import mongoose, { Document, Schema } from 'mongoose'

interface ITypeV2 extends Document {
  name: string
  red: string
  yellow: string
  green: string
  mandatory: boolean
  extraInfo: unknown
  characteristics: mongoose.Types.ObjectId[]
  slug?: string
  order?: number
}

const typeSchema = new Schema<ITypeV2>({
  name: {
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
  mandatory: {
    type: Boolean,
    required: true
  },
  extraInfo: {
    type: Schema.Types.Mixed,
    required: false,
    default: {}
  },
  characteristics: [{
    type: Schema.Types.ObjectId,
    ref: 'CharacteristicV2'
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

typeSchema.set('toJSON', {
  transform: (doc, returnObj) => {
    if (returnObj._id) {
      returnObj.id = returnObj._id.toString()
      delete returnObj._id
      delete returnObj.__v
    }
  }
})

export = mongoose.model<ITypeV2>('TypeV2', typeSchema, 'v2_types')
