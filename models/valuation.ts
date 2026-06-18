import mongoose, { Document, Schema } from 'mongoose'

interface IValuation extends Document {
  name: string
  category: string
  maxValue: number
}

const valuationSchema = new Schema<IValuation>({
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
  }
})
valuationSchema.set('toJSON', {
  transform: (doc, returnObj) => {
    returnObj.id = returnObj._id.toString()
    delete returnObj._id
    delete returnObj.__v
  }
})

export = mongoose.model<IValuation>('Valuation', valuationSchema)
