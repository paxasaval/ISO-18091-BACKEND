// Modelo v2 de IndicatorInstance. Coleccion 'v2_indicator_instances'.
// Renombres: gadID->gadId, indicatorID->indicatorInstanceId.
// NOTA: en v1 'indicatorID' referencia al catalogo Indicator; en v2 ese campo
// pasa a 'indicatorInstanceId' por el renombre global solicitado.
// Nuevo: maturityLevel (RESERVADO, no se calcula aun; separado de qualification).
import mongoose, { Document, Schema } from 'mongoose'

interface IIndicatorInstanceV2 extends Document {
  gadId: mongoose.Types.ObjectId
  indicatorInstanceId: mongoose.Types.ObjectId
  period: mongoose.Types.ObjectId
  year: string
  qualification: number
  maturityLevel?: number
  create: Date
  state: boolean
  lastUpdate?: Date
  lastUpdateBy?: mongoose.Types.ObjectId
  createdBy?: mongoose.Types.ObjectId
  subindicators: mongoose.Types.ObjectId[]
}

const indicatorInstanceSchema = new Schema<IIndicatorInstanceV2>({
  gadId: {
    type: Schema.Types.ObjectId,
    ref: 'GadV2',
    required: true
  },
  indicatorInstanceId: {
    type: Schema.Types.ObjectId,
    ref: 'IndicatorV2',
    required: true
  },
  period: {
    type: Schema.Types.ObjectId,
    ref: 'PeriodV2',
    required: true
  },
  year: {
    type: String,
    required: true
  },
  qualification: {
    type: Number,
    required: true
  },
  maturityLevel: {
    type: Number,
    required: false
  },
  create: {
    type: Date,
    required: true
  },
  state: {
    type: Boolean,
    required: true
  },
  lastUpdate: {
    type: Date,
    required: false
  },
  lastUpdateBy: {
    type: Schema.Types.ObjectId,
    ref: 'UserV2',
    required: false
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'UserV2'
  },
  subindicators: [{
    type: Schema.Types.ObjectId,
    ref: 'SubindicatorV2'
  }]
})

indicatorInstanceSchema.set('toJSON', {
  transform: (doc, returnObj) => {
    if (returnObj._id) {
      returnObj.id = returnObj._id.toString()
      delete returnObj._id
      delete returnObj.__v
    }
  }
})

export = mongoose.model<IIndicatorInstanceV2>(
  'IndicatorInstanceV2',
  indicatorInstanceSchema,
  'v2_indicator_instances'
)
