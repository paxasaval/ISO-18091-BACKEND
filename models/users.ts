import mongoose, { Document, Schema } from 'mongoose'
import uniqueValidator = require('mongoose-unique-validator')

interface IUser extends Document {
  name: string
  mail: string
  image?: string
  password: string
  rol: mongoose.Types.ObjectId
  created: Date
  lastUpdate: Date
  state: boolean
  gadID: mongoose.Types.ObjectId
}

const usersSchema = new Schema<IUser>({
  name: {
    type: String,
    required: true
  },
  mail: {
    type: String,
    required: true,
    unique: true
  },
  image: {
    type: String,
    required: false
  },
  password: {
    type: String,
    required: true,
    select: true
  },
  rol: {
    type: Schema.Types.ObjectId,
    ref: 'Rol',
    required: true
  },
  created: {
    type: Date,
    required: true
  },
  lastUpdate: {
    type: Date,
    required: true
  },
  state: {
    type: Boolean,
    default: true
  },
  gadID: {
    type: Schema.Types.ObjectId,
    ref: 'Gad',
    required: true
  }
})
usersSchema.plugin(uniqueValidator)

usersSchema.set('toJSON', {
  transform: (doc, returnObj) => {
    if (returnObj._id) {
      returnObj.id = returnObj._id.toString()
      delete returnObj._id
      delete returnObj.__v
      delete returnObj.password
    }
  }
})

export = mongoose.model<IUser>('User', usersSchema)
