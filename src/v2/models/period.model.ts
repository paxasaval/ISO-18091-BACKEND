// Modelo v2 de Period. Coleccion 'v2_periods'.
import mongoose, { Document, Schema } from 'mongoose'

interface IPeriodV2 extends Document {
  year: string
  gad: mongoose.Types.ObjectId
  createdBy: mongoose.Types.ObjectId
}

const periodSchema = new Schema<IPeriodV2>({
  year: {
    type: String,
    required: true
  },
  gad: {
    type: Schema.Types.ObjectId,
    ref: 'GadV2',
    required: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'UserV2',
    required: true
  }
})

periodSchema.set('toJSON', {
  transform: (doc, returnObj) => {
    if (returnObj._id) {
      returnObj.id = returnObj._id.toString()
      delete returnObj._id
      delete returnObj.__v
    }
  }
})

export = mongoose.model<IPeriodV2>('PeriodV2', periodSchema, 'v2_periods')
