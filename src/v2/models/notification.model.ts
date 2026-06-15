// Modelo v2 de Notification. Coleccion 'v2_notifications'.
// Nuevos: entityType/action (enums etiquetados, reemplazan a los numericos
// type/itemType del FE). Se conservan type/itemType numericos para compat.
import mongoose, { Document, Schema } from 'mongoose'

interface INotificationV2 extends Document {
  type?: number
  from?: mongoose.Types.ObjectId
  sendTo?: mongoose.Types.ObjectId
  content: string
  itemType?: number
  itemID?: string
  entityType?: string
  action?: string
  date: Date
  state: number
}

const notificationSchema = new Schema<INotificationV2>({
  type: {
    type: Number,
    required: false
  },
  from: {
    type: Schema.Types.ObjectId,
    ref: 'UserV2',
    required: false
  },
  sendTo: {
    type: Schema.Types.ObjectId,
    ref: 'UserV2',
    required: false
  },
  content: {
    type: String,
    required: false
  },
  itemType: {
    type: Number,
    required: false
  },
  itemID: {
    type: String,
    required: false
  },
  entityType: {
    type: String,
    required: false
  },
  action: {
    type: String,
    required: false
  },
  date: {
    type: Date,
    required: false
  },
  state: {
    type: Number,
    required: true
  }
})

notificationSchema.set('toJSON', {
  transform: (doc, returnObj) => {
    if (returnObj._id) {
      returnObj.id = returnObj._id.toString()
      delete returnObj._id
      delete returnObj.__v
    }
  }
})

export = mongoose.model<INotificationV2>(
  'NotificationV2',
  notificationSchema,
  'v2_notifications'
)
