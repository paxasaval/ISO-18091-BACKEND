import mongoose, { Document, Schema } from 'mongoose'

interface ICharacteristic extends Document {
  name: string
  type: number
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
  valuation: mongoose.Types.ObjectId[]
  extras: unknown
  allowed_formats: string[]
}

const characteristicSchema = new Schema<ICharacteristic>({
  name: {
    type: String,
    required: true
  },
  type: {
    type: Number,
    required: false,
    default: 1
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
  valuation: [{
    type: Schema.Types.ObjectId,
    ref: 'Valuation',
    required: true
  }],
  extras: {
    type: Schema.Types.Mixed,
    required: false,
    default: {}
  },
  allowed_formats: [{
    type: String,
    required: true
  }]
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

export = mongoose.model<ICharacteristic>('Characteristic', characteristicSchema)
