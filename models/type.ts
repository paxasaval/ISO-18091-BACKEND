import mongoose, { Document, Schema } from 'mongoose'

interface IType extends Document {
  name: string
  red: string
  yellow: string
  green: string
  mandatory: boolean
  extraInfo: unknown
  characteristics: mongoose.Types.ObjectId[]
}

const typeSchema = new Schema<IType>({
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
    ref: 'Characteristic'
  }]
})
typeSchema.set('toJSON', {
  transform: (doc, returnObj) => {
    returnObj.id = returnObj._id.toString()
    delete returnObj._id
    delete returnObj.__v
  }
})

export = mongoose.model<IType>('Type', typeSchema)
