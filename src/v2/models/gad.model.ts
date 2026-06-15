// Modelo v2 de Gad. Coleccion 'v2_gads'.
import mongoose, { Document, Schema } from 'mongoose'

interface IGadV2 extends Document {
  name: string
  code: string
  city: string
  country: string
  size: number
  admin: mongoose.Types.ObjectId[]
  staff: mongoose.Types.ObjectId[]
  users: mongoose.Types.ObjectId[]
  state: boolean
  publishAuto: boolean
  report: mongoose.Types.ObjectId[]
  reportDefault?: mongoose.Types.ObjectId
}

const gadSchema = new Schema<IGadV2>({
  name: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: false
  },
  city: {
    type: String,
    required: false
  },
  country: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  admin: [{
    type: Schema.Types.ObjectId,
    ref: 'UserV2',
    required: false
  }],
  staff: [{
    type: Schema.Types.ObjectId,
    ref: 'UserV2',
    required: false
  }],
  users: [{
    type: Schema.Types.ObjectId,
    ref: 'UserV2',
    required: false
  }],
  state: {
    type: Boolean,
    required: true
  },
  publishAuto: {
    type: Boolean,
    required: true
  },
  report: [{
    type: Schema.Types.ObjectId,
    ref: 'ReportV2',
    required: false
  }],
  reportDefault: {
    type: Schema.Types.ObjectId,
    ref: 'ReportV2',
    required: false
  }
})

gadSchema.set('toJSON', {
  transform: (doc, returnObj) => {
    if (returnObj._id) {
      returnObj.id = returnObj._id.toString()
      delete returnObj._id
      delete returnObj.__v
    }
  }
})

export = mongoose.model<IGadV2>('GadV2', gadSchema, 'v2_gads')
