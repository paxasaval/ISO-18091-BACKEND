import mongoose, { Document, Schema } from 'mongoose'

interface IOds extends Document {
  number: number
  name: string
  img: string
}

const odsShema = new Schema<IOds>({
  number: Number,
  name: String,
  img: String
})
odsShema.set('toJSON', {
  transform: (doc, returnObj) => {
    returnObj.id = returnObj._id.toString()
    delete returnObj._id
    delete returnObj.__v
  }
})

export = mongoose.model<IOds>('Ods', odsShema)
