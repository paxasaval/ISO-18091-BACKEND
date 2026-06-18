// Modelo v2 de Sponsor. Coleccion 'v2_sponsors'.
import mongoose, { Document, Schema } from 'mongoose'

interface ISponsorV2 extends Document {
  name: string
  description: string
  gad: mongoose.Types.ObjectId
  image: string
  state: boolean
}

const sponsorSchema = new Schema<ISponsorV2>({
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
    ref: 'GadV2',
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
    if (returnObj._id) {
      returnObj.id = returnObj._id.toString()
      delete returnObj._id
      delete returnObj.__v
    }
  }
})

export = mongoose.model<ISponsorV2>('SponsorV2', sponsorSchema, 'v2_sponsors')
