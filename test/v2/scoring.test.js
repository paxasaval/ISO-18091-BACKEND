// Test unitario del servicio de scoring v2.
// Verifica la formula de calificacion sobre datos en memoria (MongoDB in-memory).
//
// Casos cubiertos:
//  - Sin assessments verificados -> subindicador queda en 0
//  - Solo assessments verificados puntuan (no verificados ignorados)
//  - Pesos via weight (de Valuation.maxValue)
//  - Criterio critico (tier > 1) no cubierto -> topa a rojo (1)
//  - Criterio critico cubierto -> qualification segun umbrales
//  - Mapeo percent -> 0-3 con umbrales del Type (red/yellow/green)
//  - Agregacion IndicatorInstance: minimo de quals > 0; 0 si todos son 0
//  - IndicatorInstance sin subindicadores -> 0

const db = require('../helpers/db')
const seed = require('../helpers/seed-v2')
const scoringService = require('../../src/v2/services/scoring.service')
const CharacteristicAssessment = require('../../src/v2/models/characteristic-assessment.model')
const Subindicator = require('../../src/v2/models/subindicator.model')
const IndicatorInstance = require('../../src/v2/models/indicator-instance.model')

beforeAll(async () => {
  await db.connect()
})
afterEach(async () => {
  await db.clear()
})
afterAll(async () => {
  await db.disconnect()
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeAssessment = async (sub, characteristic, { met, weight, verified = true } = {}) => {
  return new CharacteristicAssessment({
    subindicatorId: sub._id,
    characteristicId: characteristic._id,
    criteria: [{ valuationId: characteristic.valuations[0] || sub._id, met, weight }],
    score: met ? weight : 0,
    totalRubric: weight,
    verified,
    sourceOverrides: [],
    qualifiedAt: new Date(),
    qualifiedBy: sub.createdBy
  }).save()
}

// ---------------------------------------------------------------------------
// recomputeSubindicator
// ---------------------------------------------------------------------------

describe('recomputeSubindicator — sin assessments verificados', () => {
  test('queda en 0 (sin evaluar)', async () => {
    const sub = await seed.createSubindicatorV2()
    await scoringService.recomputeSubindicator(sub._id.toString())
    const updated = await Subindicator.findById(sub._id)
    expect(updated.qualification).toBe(0)
    expect(updated.score).toBe(0)
    expect(updated.totalScore).toBe(0)
  })
})

describe('recomputeSubindicator — solo verificados puntuan', () => {
  test('assessment no verificado no modifica la nota', async () => {
    const valuation = await seed.createValuationV2({ maxValue: 1 })
    const characteristic = await seed.createCharacteristicV2({
      valuations: [valuation._id],
      tier: 1
    })
    const type = await seed.createTypeV2({
      characteristics: [characteristic._id],
      red: '0.50',
      yellow: '0.75'
    })
    const sub = await seed.createSubindicatorV2({ type })

    // Assessment con met=true pero NO verificado
    await makeAssessment(sub, characteristic, { met: true, weight: 1, verified: false })

    await scoringService.recomputeSubindicator(sub._id.toString())
    const updated = await Subindicator.findById(sub._id)
    // Sin verificados -> 0
    expect(updated.qualification).toBe(0)
  })

  test('un verificado + uno no verificado: solo cuenta el verificado', async () => {
    const v1 = await seed.createValuationV2({ maxValue: 1 })
    const ch1 = await seed.createCharacteristicV2({ valuations: [v1._id], tier: 1 })
    const v2 = await seed.createValuationV2({ maxValue: 1 })
    const ch2 = await seed.createCharacteristicV2({ valuations: [v2._id], tier: 1 })
    const type = await seed.createTypeV2({
      characteristics: [ch1._id, ch2._id],
      red: '0.50',
      yellow: '0.75'
    })
    const sub = await seed.createSubindicatorV2({ type })

    // ch1 verificado con 100% cumplimiento
    await makeAssessment(sub, ch1, { met: true, weight: 1, verified: true })
    // ch2 no verificado
    await makeAssessment(sub, ch2, { met: true, weight: 1, verified: false })

    await scoringService.recomputeSubindicator(sub._id.toString())
    const updated = await Subindicator.findById(sub._id)
    // Solo ch1 verificado: percent = 1.0 -> verde (3)
    expect(updated.qualification).toBe(3)
    expect(updated.score).toBe(1)   // 1 caracteristica verificada, percent suma 1.0
    expect(updated.totalScore).toBe(1)
  })
})

describe('recomputeSubindicator — pesos via weight', () => {
  test('pesos distintos: score ponderado', async () => {
    // Criterio A: weight=2, met=true  -> contribuye 2
    // Criterio B: weight=3, met=false -> contribuye 0
    // percent = 2/5 = 0.4 -> rojo (1) con red=0.50
    const valA = await seed.createValuationV2({ maxValue: 2 })
    const valB = await seed.createValuationV2({ maxValue: 3 })
    const ch = await seed.createCharacteristicV2({
      valuations: [valA._id, valB._id],
      tier: 1
    })
    const type = await seed.createTypeV2({
      characteristics: [ch._id],
      red: '0.50',
      yellow: '0.75'
    })
    const sub = await seed.createSubindicatorV2({ type })

    await new CharacteristicAssessment({
      subindicatorId: sub._id,
      characteristicId: ch._id,
      criteria: [
        { valuationId: valA._id, met: true, weight: 2 },
        { valuationId: valB._id, met: false, weight: 3 }
      ],
      score: 2,
      totalRubric: 5,
      verified: true,
      sourceOverrides: [],
      qualifiedAt: new Date(),
      qualifiedBy: sub.createdBy
    }).save()

    await scoringService.recomputeSubindicator(sub._id.toString())
    const updated = await Subindicator.findById(sub._id)
    // percent = 2/5 = 0.4 < 0.50 -> rojo (1)
    expect(updated.qualification).toBe(1)
  })

  test('todos cumplidos con pesos distintos -> verde (3)', async () => {
    const valA = await seed.createValuationV2({ maxValue: 2 })
    const valB = await seed.createValuationV2({ maxValue: 3 })
    const ch = await seed.createCharacteristicV2({
      valuations: [valA._id, valB._id],
      tier: 1
    })
    const type = await seed.createTypeV2({
      characteristics: [ch._id],
      red: '0.50',
      yellow: '0.75'
    })
    const sub = await seed.createSubindicatorV2({ type })

    await new CharacteristicAssessment({
      subindicatorId: sub._id,
      characteristicId: ch._id,
      criteria: [
        { valuationId: valA._id, met: true, weight: 2 },
        { valuationId: valB._id, met: true, weight: 3 }
      ],
      score: 5,
      totalRubric: 5,
      verified: true,
      sourceOverrides: [],
      qualifiedAt: new Date(),
      qualifiedBy: sub.createdBy
    }).save()

    await scoringService.recomputeSubindicator(sub._id.toString())
    const updated = await Subindicator.findById(sub._id)
    // percent = 5/5 = 1.0 >= 0.75 -> verde (3)
    expect(updated.qualification).toBe(3)
  })
})

describe('recomputeSubindicator — criterio critico (tier > 1)', () => {
  test('caracteristica critica sin assessment verificado -> topa a rojo (1)', async () => {
    // Dos caracteristicas: una normal (tier=1) verificada al 100%, una critica (tier=2) sin assessment
    const vN = await seed.createValuationV2({ maxValue: 1 })
    const chNormal = await seed.createCharacteristicV2({ valuations: [vN._id], tier: 1 })

    const vC = await seed.createValuationV2({ maxValue: 1 })
    const chCritical = await seed.createCharacteristicV2({ valuations: [vC._id], tier: 2 })

    const type = await seed.createTypeV2({
      characteristics: [chNormal._id, chCritical._id],
      red: '0.50',
      yellow: '0.75'
    })
    const sub = await seed.createSubindicatorV2({ type })

    // Solo la normal está verificada
    await makeAssessment(sub, chNormal, { met: true, weight: 1, verified: true })
    // La critica no tiene assessment

    await scoringService.recomputeSubindicator(sub._id.toString())
    const updated = await Subindicator.findById(sub._id)
    // Critico sin cobertura -> topa a 1
    expect(updated.qualification).toBe(1)
  })

  test('caracteristica critica con percent=0 -> topa a rojo (1)', async () => {
    const vC = await seed.createValuationV2({ maxValue: 1 })
    const chCritical = await seed.createCharacteristicV2({ valuations: [vC._id], tier: 2 })
    const type = await seed.createTypeV2({
      characteristics: [chCritical._id],
      red: '0.50',
      yellow: '0.75'
    })
    const sub = await seed.createSubindicatorV2({ type })

    // Assessment verificado pero met=false -> percent = 0
    await makeAssessment(sub, chCritical, { met: false, weight: 1, verified: true })

    await scoringService.recomputeSubindicator(sub._id.toString())
    const updated = await Subindicator.findById(sub._id)
    expect(updated.qualification).toBe(1)
  })

  test('caracteristica critica cubierta -> qualification segun umbrales', async () => {
    const vC = await seed.createValuationV2({ maxValue: 1 })
    const chCritical = await seed.createCharacteristicV2({ valuations: [vC._id], tier: 2 })
    const type = await seed.createTypeV2({
      characteristics: [chCritical._id],
      red: '0.50',
      yellow: '0.75'
    })
    const sub = await seed.createSubindicatorV2({ type })

    // Assessment verificado con 100% cumplimiento
    await makeAssessment(sub, chCritical, { met: true, weight: 1, verified: true })

    await scoringService.recomputeSubindicator(sub._id.toString())
    const updated = await Subindicator.findById(sub._id)
    // percent = 1.0 >= 0.75 -> verde (3)
    expect(updated.qualification).toBe(3)
  })
})

describe('recomputeSubindicator — mapeo percent -> 0-3', () => {
  // Helper: crea type+sub+assessment con un porcentaje dado y verifica qual.
  // Para lograr percent = p/q, creamos DOS criterios:
  //   criterio A (met=true,  weight=p)
  //   criterio B (met=false, weight=q-p)
  // -> score = p, totalRubric = q, percent = p/q
  const testMapping = async (percent, red, yellow, expectedQual) => {
    // Usar denominador 10 para evitar floats imprecisos
    const DENOM = 10
    const scoreWeight = Math.round(percent * DENOM)   // parte cumplida
    const restWeight  = DENOM - scoreWeight           // parte no cumplida

    const valA = await seed.createValuationV2({ maxValue: scoreWeight || 1 })
    const valB = await seed.createValuationV2({ maxValue: restWeight || 1 })
    const ch = await seed.createCharacteristicV2({ valuations: [valA._id, valB._id], tier: 1 })
    const type = await seed.createTypeV2({
      characteristics: [ch._id],
      red: String(red),
      yellow: String(yellow)
    })
    const sub = await seed.createSubindicatorV2({ type })

    // Dos criterios: el primero met=true si scoreWeight>0, el segundo met=false
    const criteria = []
    if (scoreWeight > 0) {
      criteria.push({ valuationId: valA._id, met: true, weight: scoreWeight })
    }
    if (restWeight > 0) {
      criteria.push({ valuationId: valB._id, met: false, weight: restWeight })
    }
    // Caso borde: percent=0 -> un criterio met=false
    if (criteria.length === 0) {
      criteria.push({ valuationId: valA._id, met: false, weight: 1 })
    }

    await new CharacteristicAssessment({
      subindicatorId: sub._id,
      characteristicId: ch._id,
      criteria,
      score: scoreWeight,
      totalRubric: DENOM,
      verified: true,
      sourceOverrides: [],
      qualifiedAt: new Date(),
      qualifiedBy: sub.createdBy
    }).save()

    await scoringService.recomputeSubindicator(sub._id.toString())
    const updated = await Subindicator.findById(sub._id)
    expect(updated.qualification).toBe(expectedQual)
  }

  test('percent < red -> 1 (rojo)', async () => {
    await testMapping(0.3, 0.5, 0.75, 1)
  })

  test('percent == red -> 2 (amarillo)', async () => {
    await testMapping(0.5, 0.5, 0.75, 2)
  })

  test('percent entre red y yellow -> 2 (amarillo)', async () => {
    await testMapping(0.6, 0.5, 0.75, 2)
  })

  test('percent >= yellow -> 3 (verde)', async () => {
    await testMapping(0.8, 0.5, 0.75, 3)
  })

  test('percent == 1.0 -> 3 (verde)', async () => {
    await testMapping(1.0, 0.5, 0.75, 3)
  })
})

describe('recomputeSubindicator — idempotencia', () => {
  test('llamar dos veces produce el mismo resultado', async () => {
    const val = await seed.createValuationV2({ maxValue: 1 })
    const ch = await seed.createCharacteristicV2({ valuations: [val._id], tier: 1 })
    const type = await seed.createTypeV2({
      characteristics: [ch._id],
      red: '0.50',
      yellow: '0.75'
    })
    const sub = await seed.createSubindicatorV2({ type })
    await makeAssessment(sub, ch, { met: true, weight: 1, verified: true })

    await scoringService.recomputeSubindicator(sub._id.toString())
    const first = await Subindicator.findById(sub._id)

    await scoringService.recomputeSubindicator(sub._id.toString())
    const second = await Subindicator.findById(sub._id)

    expect(second.qualification).toBe(first.qualification)
    expect(second.score).toBe(first.score)
  })
})

// ---------------------------------------------------------------------------
// recomputeIndicatorInstance
// ---------------------------------------------------------------------------

describe('recomputeIndicatorInstance — agregacion', () => {
  test('sin subindicadores -> 0', async () => {
    const inst = await seed.createIndicatorInstanceV2()
    await scoringService.recomputeIndicatorInstance(inst._id.toString())
    const updated = await IndicatorInstance.findById(inst._id)
    expect(updated.qualification).toBe(0)
  })

  test('todos los subindicadores en 0 -> instance en 0', async () => {
    const inst = await seed.createIndicatorInstanceV2()
    const sub1 = await seed.createSubindicatorV2({ indicatorInstance: inst })
    const sub2 = await seed.createSubindicatorV2({ indicatorInstance: inst })

    // Enlazar subindicadores a la instancia
    await IndicatorInstance.findByIdAndUpdate(inst._id, {
      subindicators: [sub1._id, sub2._id]
    })

    // Ambos en qualification=0 (default)
    await scoringService.recomputeIndicatorInstance(inst._id.toString())
    const updated = await IndicatorInstance.findById(inst._id)
    expect(updated.qualification).toBe(0)
  })

  test('minimo de quals > 0', async () => {
    const inst = await seed.createIndicatorInstanceV2()
    const sub1 = await seed.createSubindicatorV2({ indicatorInstance: inst })
    const sub2 = await seed.createSubindicatorV2({ indicatorInstance: inst })
    const sub3 = await seed.createSubindicatorV2({ indicatorInstance: inst })

    await IndicatorInstance.findByIdAndUpdate(inst._id, {
      subindicators: [sub1._id, sub2._id, sub3._id]
    })

    // Setear qualifications: 3, 2, 0
    await Subindicator.findByIdAndUpdate(sub1._id, { qualification: 3 })
    await Subindicator.findByIdAndUpdate(sub2._id, { qualification: 2 })
    await Subindicator.findByIdAndUpdate(sub3._id, { qualification: 0 })

    await scoringService.recomputeIndicatorInstance(inst._id.toString())
    const updated = await IndicatorInstance.findById(inst._id)
    // Minimo de {3, 2} (ignorando 0) = 2
    expect(updated.qualification).toBe(2)
  })

  test('un solo subindicador en 1 -> instance en 1', async () => {
    const inst = await seed.createIndicatorInstanceV2()
    const sub = await seed.createSubindicatorV2({ indicatorInstance: inst })

    await IndicatorInstance.findByIdAndUpdate(inst._id, {
      subindicators: [sub._id]
    })
    await Subindicator.findByIdAndUpdate(sub._id, { qualification: 1 })

    await scoringService.recomputeIndicatorInstance(inst._id.toString())
    const updated = await IndicatorInstance.findById(inst._id)
    expect(updated.qualification).toBe(1)
  })

  test('mezcla 0 y > 0: ignora los 0', async () => {
    const inst = await seed.createIndicatorInstanceV2()
    const sub1 = await seed.createSubindicatorV2({ indicatorInstance: inst })
    const sub2 = await seed.createSubindicatorV2({ indicatorInstance: inst })

    await IndicatorInstance.findByIdAndUpdate(inst._id, {
      subindicators: [sub1._id, sub2._id]
    })
    await Subindicator.findByIdAndUpdate(sub1._id, { qualification: 0 })
    await Subindicator.findByIdAndUpdate(sub2._id, { qualification: 3 })

    await scoringService.recomputeIndicatorInstance(inst._id.toString())
    const updated = await IndicatorInstance.findById(inst._id)
    expect(updated.qualification).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// recomputeAfterEvidenceChange — flujo integrado
// ---------------------------------------------------------------------------

describe('recomputeAfterEvidenceChange — flujo integrado', () => {
  test('tras qualify+verify el subindicador recomputa qualification', async () => {
    const val = await seed.createValuationV2({ maxValue: 1 })
    const ch = await seed.createCharacteristicV2({ valuations: [val._id], tier: 1 })
    const type = await seed.createTypeV2({
      characteristics: [ch._id],
      red: '0.50',
      yellow: '0.75'
    })
    const inst = await seed.createIndicatorInstanceV2()
    const sub = await seed.createSubindicatorV2({ type, indicatorInstance: inst })

    await IndicatorInstance.findByIdAndUpdate(inst._id, {
      subindicators: [sub._id]
    })

    // Crear assessment verificado para el subindicador
    await new CharacteristicAssessment({
      subindicatorId: sub._id,
      characteristicId: ch._id,
      criteria: [{ valuationId: val._id, met: true, weight: 1 }],
      score: 1,
      totalRubric: 1,
      verified: true,
      sourceOverrides: [],
      qualifiedAt: new Date(),
      qualifiedBy: sub.createdBy
    }).save()

    // Recompute como lo haria qualify
    await scoringService.recomputeAfterEvidenceChange(sub._id.toString())

    const updatedSub = await Subindicator.findById(sub._id)
    const updatedInst = await IndicatorInstance.findById(inst._id)

    expect(updatedSub.qualification).toBe(3)   // 100% -> verde
    expect(updatedInst.qualification).toBe(3)  // minimo de {3} = 3
  })

  test('caso limite: sin assessments verificados -> sub=0, instance=0', async () => {
    const inst = await seed.createIndicatorInstanceV2()
    const sub = await seed.createSubindicatorV2({ indicatorInstance: inst })

    await IndicatorInstance.findByIdAndUpdate(inst._id, {
      subindicators: [sub._id]
    })

    await scoringService.recomputeAfterEvidenceChange(sub._id.toString())

    const updatedSub = await Subindicator.findById(sub._id)
    const updatedInst = await IndicatorInstance.findById(inst._id)

    expect(updatedSub.qualification).toBe(0)
    expect(updatedInst.qualification).toBe(0)
  })
})
