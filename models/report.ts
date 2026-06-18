import mongoose, { Document, Schema } from 'mongoose'

interface IInfo {
  label: string
  data: string
}

interface IReport extends Document {
  info: IInfo[]
  source: string
  period: string
}

const infoSchema = new Schema<IInfo>({
  label: {
    type: String,
    required: true
  },
  data: {
    type: String,
    required: true
  }
})

const reportSchema = new Schema<IReport>({
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

export = mongoose.model<IReport>('Report', reportSchema)
