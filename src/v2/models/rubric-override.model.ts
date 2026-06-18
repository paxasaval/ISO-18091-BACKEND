// Entidad NUEVA v2: RubricOverride. Coleccion 'v2_rubric_overrides'.
// RESERVADO: soporte futuro de pesos de rubrica por GAD (override del catalogo
// global). Estructura minima, no se usa aun.
import mongoose, { Document, Schema } from 'mongoose'

interface IOverrideCriterion {
  valuationId: mongoose.Types.ObjectId
  weight: number
}

interface IRubricOverrideV2 extends Document {
  gadId: mongoose.Types.ObjectId
  characteristicId: mongoose.Types.ObjectId
  criteria: IOverrideCriterion[]
}

const overrideCriterionSchema = new Schema<IOverrideCriterion>({
  valuationId: {
    type: Schema.Types.ObjectId,
    ref: 'ValuationV2',
    required: true
  },
  weight: {
    type: Number,
    required: true
  }
})

const rubricOverrideSchema = new Schema<IRubricOverrideV2>({
  gadId: {
    type: Schema.Types.ObjectId,
    ref: 'GadV2',
    required: true
  },
  characteristicId: {
    type: Schema.Types.ObjectId,
    ref: 'CharacteristicV2',
    required: true
  },
  criteria: [{
    type: overrideCriterionSchema,
    required: false
  }]
})

rubricOverrideSchema.set('toJSON', {
  transform: (doc, returnObj) => {
    if (returnObj._id) {
      returnObj.id = returnObj._id.toString()
      delete returnObj._id
      delete returnObj.__v
    }
  }
})

export = mongoose.model<IRubricOverrideV2>(
  'RubricOverrideV2',
  rubricOverrideSchema,
  'v2_rubric_overrides'
)
