import mongoose, { Document, Schema } from 'mongoose'

interface ISponsor extends Document {
  name: string
  description: string
  gad: mongoose.Types.ObjectId
  image: string
  state: boolean
}

const sponsorSchema = new Schema<ISponsor>({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  gad: {
    type: Schema.Types.ObjectId,
    ref: 'Gad',
    required: true
  },
  image: {
    type: String,
    required: true
  },
  state: {
    type: Boolean,
    required: true
  }
})
sponsorSchema.set('toJSON', {
  transform: (doc, returnObj) => {
    returnObj.id = returnObj._id.toString()
    delete returnObj._id
    delete returnObj.__v
  }
})

export = mongoose.model<ISponsor>('Sponsor', sponsorSchema)
