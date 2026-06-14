import mongoose, { Document, Schema } from 'mongoose'

interface IIndicator extends Document {
  name: string
  description: string
  number: number
  quadrant: number
  quadrantName: string
  red: string
  yellow: string
  green: string
  ods: mongoose.Types.ObjectId[]
}

const indicadorSchema = new Schema<IIndicator>({
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
    ref: 'Ods'
  }]
})
indicadorSchema.set('toJSON', {
  transform: (doc, returnObj) => {
    const id = returnObj._id.toString()
    returnObj.id = id
    delete returnObj._id
    delete returnObj.__v
  }
})

export = mongoose.model<IIndicator>('Indicator', indicadorSchema)
