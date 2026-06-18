import mongoose, { Document, Schema } from 'mongoose'

interface IGad extends Document {
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

const gadSchema = new Schema<IGad>({
  name: {
    type: String,
    required: true
  },
  code: {
    type: String,
    requred: true
  },
  city: {
    type: String,
    requred: true
  },
  country: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  admin: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false
    }
  ],
  staff: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false
    }
  ],
  users: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false
    }
  ],
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
    ref: 'Report',
    required: false
  }],
  reportDefault: {
    type: Schema.Types.ObjectId,
    ref: 'Report',
    required: false
  }
})
gadSchema.set('toJSON', {
  transform: (doc, returnObj) => {
    returnObj.id = returnObj._id.toString()
    delete returnObj._id
    delete returnObj.__v
  }
})

export = mongoose.model<IGad>('Gad', gadSchema)
