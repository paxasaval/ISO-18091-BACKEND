// Modelo v2 de User. Coleccion 'v2_users'.
// Renombres: mail->email, gadID->gadId.
import mongoose, { Document, Schema } from 'mongoose'
import uniqueValidator = require('mongoose-unique-validator')

interface IUserV2 extends Document {
  name: string
  email: string
  image?: string
  password: string
  rol: mongoose.Types.ObjectId
  created: Date
  lastUpdate: Date
  state: boolean
  gadId: mongoose.Types.ObjectId
}

const userSchema = new Schema<IUserV2>({
  name: {
    type: String,
    required: true
  },
  email: {
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
    ref: 'RolV2',
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
  gadId: {
    type: Schema.Types.ObjectId,
    ref: 'GadV2',
    required: true
  }
})

userSchema.plugin(uniqueValidator)

userSchema.set('toJSON', {
  transform: (doc, returnObj) => {
    if (returnObj._id) {
      returnObj.id = returnObj._id.toString()
      delete returnObj._id
      delete returnObj.__v
      delete returnObj.password
    }
  }
})

export = mongoose.model<IUserV2>('UserV2', userSchema, 'v2_users')
