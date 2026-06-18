// Modelo v2 de Rol. Coleccion 'v2_rols'.
// Anade code estable + permissions[] (auth v2 gatea por permiso) + slug/order.
import mongoose, { Document, Schema } from 'mongoose'

interface IRolV2 extends Document {
  name: string
  description: string
  code?: string
  permissions: string[]
  slug?: string
  order?: number
}

const rolSchema = new Schema<IRolV2>({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: false
  },
  permissions: [{
    type: String,
    required: false
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

rolSchema.set('toJSON', {
  transform: (doc, returnObj) => {
    if (returnObj._id) {
      returnObj.id = returnObj._id.toString()
      delete returnObj._id
      delete returnObj.__v
    }
  }
})

export = mongoose.model<IRolV2>('RolV2', rolSchema, 'v2_rols')
