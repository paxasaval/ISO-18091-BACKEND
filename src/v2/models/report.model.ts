// Modelo v2 de Report. Coleccion 'v2_reports'.
import mongoose, { Document, Schema } from 'mongoose'

interface IInfoV2 {
  label: string
  data: string
}

interface IReportV2 extends Document {
  info: IInfoV2[]
  source: string
  period: string
}

const infoSchema = new Schema<IInfoV2>({
  label: {
    type: String,
    required: true
  },
  data: {
    type: String,
    required: true
  }
})

const reportSchema = new Schema<IReportV2>({
  info: [{
    type: infoSchema,
    required: true
  }],
  source: {
    type: String,
    required: true
  },
  period: {
    type: String,
    required: true
  }
})

reportSchema.set('toJSON', {
  transform: (doc, returnObj) => {
    if (returnObj._id) {
      returnObj.id = returnObj._id.toString()
      delete returnObj._id
      delete returnObj.__v
    }
  }
})

export = mongoose.model<IReportV2>('ReportV2', reportSchema, 'v2_reports')
