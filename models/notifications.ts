import mongoose, { Document, Schema } from 'mongoose'

interface INotification extends Document {
  type: number
  from?: mongoose.Types.ObjectId
  sendTo?: mongoose.Types.ObjectId
  content: string
  itemType: number
  itemID?: string
  date: Date
  state: number
}

const notificationSchema = new Schema<INotification>({
  type: {
    type: Number,
    requred: true
  },
  from: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  sendTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  content: {
    type: String,
    requred: true
  },
  itemType: {
    type: Number,
    requred: true
  },
  itemID: {
    type: String,
    required: false
  },
  date: {
    type: Date,
    requred: true
  },
  state: {
    type: Number,
    required: true
  }
})
notificationSchema.set('toJSON', {
  transform: (doc, returnObj) => {
    returnObj.id = returnObj._id.toString()
    delete returnObj._id
    delete returnObj.__v
  }
})

export = mongoose.model<INotification>('Notification', notificationSchema)
