import mongoose, { Document, Schema } from 'mongoose'

interface IIndicatorInstance extends Document {
  gadID: mongoose.Types.ObjectId
  indicatorID: mongoose.Types.ObjectId
  period: mongoose.Types.ObjectId
  year: string
  qualification: number
  create: Date
  state: boolean
  lastUpdate?: Date
  lastUpdateBy?: mongoose.Types.ObjectId
  createdBy?: mongoose.Types.ObjectId
  subindicators: mongoose.Types.ObjectId[]
}

const indicadorInstanceSchema = new Schema<IIndicatorInstance>({
  gadID: {
    type: Schema.Types.ObjectId,
    ref: 'Gad',
    required: true
  },
  indicatorID: {
    type: Schema.Types.ObjectId,
    ref: 'Indicator',
    required: true
  },
  period: {
    type: Schema.Types.ObjectId,
    ref: 'Indicator',
    required: true
  },
  year: {
    type: String,
    required: true
  },
  qualification: {
    type: Number,
    required: true
  },
  create: {
    type: Date,
    required: true
  },
  state: {
    type: Boolean,
    required: true
  },
  lastUpdate: {
    type: Date,
    required: false
  },
  lastUpdateBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  subindicators: [{
    type: Schema.Types.ObjectId,
    ref: 'SubIndicator'
  }]
})
indicadorInstanceSchema.set('toJSON', {
  transform: (doc, returnObj) => {
    returnObj.id = returnObj._id.toString()
    delete returnObj._id
    delete returnObj.__v
  }
})

export = mongoose.model<IIndicatorInstance>('IndicatorInstance', indicadorInstanceSchema)
