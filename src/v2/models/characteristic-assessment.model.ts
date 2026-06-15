// Entidad NUEVA v2: CharacteristicAssessment. Coleccion 'v2_characteristic_assessments'.
// Rubrica POR caracteristica (reemplaza la Rubric por-evidencia de v1).
// criteria: un item por valuation con met (cumplido) + weight (peso del criterio).
import mongoose, { Document, Schema } from 'mongoose'

interface ICriterion {
  valuationId: mongoose.Types.ObjectId
  met: boolean
  weight: number
}

interface ICharacteristicAssessmentV2 extends Document {
  subindicatorId: mongoose.Types.ObjectId
  characteristicId: mongoose.Types.ObjectId
  criteria: ICriterion[]
  score?: number
  totalRubric?: number
  verified: boolean
  qualifiedBy?: mongoose.Types.ObjectId
  qualifiedAt?: Date
}

const criterionSchema = new Schema<ICriterion>({
  valuationId: {
    type: Schema.Types.ObjectId,
    ref: 'ValuationV2',
    required: true
  },
  met: {
    type: Boolean,
    required: true
  },
  weight: {
    type: Number,
    required: true
  }
})

const assessmentSchema = new Schema<ICharacteristicAssessmentV2>({
  subindicatorId: {
    type: Schema.Types.ObjectId,
    ref: 'SubindicatorV2',
    required: true
  },
  characteristicId: {
    type: Schema.Types.ObjectId,
    ref: 'CharacteristicV2',
    required: true
  },
  criteria: [{
    type: criterionSchema,
    required: false
  }],
  score: {
    type: Number,
    required: false
  },
  totalRubric: {
    type: Number,
    required: false
  },
  verified: {
    type: Boolean,
    default: false
  },
  qualifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'UserV2',
    required: false
  },
  qualifiedAt: {
    type: Date,
    required: false
  }
})

assessmentSchema.set('toJSON', {
  transform: (doc, returnObj) => {
    if (returnObj._id) {
      returnObj.id = returnObj._id.toString()
      delete returnObj._id
      delete returnObj.__v
    }
  }
})

export = mongoose.model<ICharacteristicAssessmentV2>(
  'CharacteristicAssessmentV2',
  assessmentSchema,
  'v2_characteristic_assessments'
)
