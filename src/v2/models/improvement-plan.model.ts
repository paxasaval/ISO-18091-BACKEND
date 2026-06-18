// Entidad NUEVA v2: ImprovementPlan. Coleccion 'v2_improvement_plans'.
// RESERVADO (ciclo PDCA). Estructura minima, sin flujo implementado.
import mongoose, { Document, Schema } from 'mongoose'

interface IImprovementPlanV2 extends Document {
  subindicatorId?: mongoose.Types.ObjectId
  indicatorInstanceId?: mongoose.Types.ObjectId
  responsibleUserId?: mongoose.Types.ObjectId
  targetDate?: Date
  status?: string
  closureEvidenceId?: mongoose.Types.ObjectId
  createdAt: Date
}

const improvementPlanSchema = new Schema<IImprovementPlanV2>({
  subindicatorId: {
    type: Schema.Types.ObjectId,
    ref: 'SubindicatorV2',
    required: false
  },
  indicatorInstanceId: {
    type: Schema.Types.ObjectId,
    ref: 'IndicatorInstanceV2',
    required: false
  },
  responsibleUserId: {
    type: Schema.Types.ObjectId,
    ref: 'UserV2',
    required: false
  },
  targetDate: {
    type: Date,
    required: false
  },
  status: {
    type: String,
    required: false
  },
  closureEvidenceId: {
    type: Schema.Types.ObjectId,
    ref: 'EvidenceV2',
    required: false
  },
  createdAt: {
    type: Date,
    required: false,
    default: Date.now
  }
})

improvementPlanSchema.set('toJSON', {
  transform: (doc, returnObj) => {
    if (returnObj._id) {
      returnObj.id = returnObj._id.toString()
      delete returnObj._id
      delete returnObj.__v
    }
  }
})

export = mongoose.model<IImprovementPlanV2>(
  'ImprovementPlanV2',
  improvementPlanSchema,
  'v2_improvement_plans'
)
