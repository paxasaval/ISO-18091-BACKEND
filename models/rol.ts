import mongoose, { Document, Schema } from 'mongoose'

interface IRol extends Document {
  name: string
  description: string
}

const rolShema = new Schema<IRol>({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  }
})
rolShema.set('toJSON', {
  transform: (doc, returnObj) => {
    returnObj.id = returnObj._id.toString()
    delete returnObj._id
    delete returnObj.__v
  }
})

export = mongoose.model<IRol>('Rol', rolShema)
