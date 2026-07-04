// Tests de /api/v2/evidences re-apuntado a la capa v2 (EvidenceV2 / v2_evidences).
// Usa seed-v2 y el grafo v2 (gad/indicatorInstance/subindicator/type/characteristic/
// valuation v2). Incluye tests de integracion del recompute de scoring (Tema 4).

const supertest = require('supertest')
const app = require('../../app')
const db = require('../helpers/db')
const seed = require('../helpers/seed-v2')
const Evidence = require('../../src/v2/models/evidence.model')
const CharacteristicAssessment = require('../../src/v2/models/characteristic-assessment.model')
const Subindicator = require('../../src/v2/models/subindicator.model')
const IndicatorInstance = require('../../src/v2/models/indicator-instance.model')

const api = supertest(app)

beforeAll(async () => {
  await db.connect()
})
afterEach(async () => {
  await db.clear()
})
afterAll(async () => {
  await db.disconnect()
})

const bearer = (token) => `Bearer ${token}`

// Administrador: tiene todos los permisos.
const adminAuth = async () => {
  const rol = await seed.createRolV2({ name: 'Administrador' })
  const { user } = await seed.createUserV2({ rol })
  const token = seed.signToken({ id: user._id.toString(), rol: rol._id.toString() })
  return { rol, user, token }
}

// Responsable: tiene evidence:upload pero no evidence:qualify ni evidence:publish.
const responsibleAuth = async () => {
  const rol = await seed.createRolV2({ name: 'Responsable' })
  const { user } = await seed.createUserV2({ rol })
  const token = seed.signToken({ id: user._id.toString(), rol: rol._id.toString() })
  return { rol, user, token }
}

// Ciudadano: sin permisos de escritura.
const citizenAuth = async () => {
  const rol = await seed.createRolV2({ name: 'Ciudadano' })
  const { user } = await seed.createUserV2({ rol })
  const token = seed.signToken({ id: user._id.toString(), rol: rol._id.toString() })
  return { rol, user, token }
}

// Crea el grafo v2 minimo: subindicador + caracteristica con valuacion.
const seedGraphV2 = async () => {
  const gad = await seed.createGadV2()
  const valuation = await seed.createValuationV2({ maxValue: 1 })
  const characteristic = await seed.createCharacteristicV2({
    valuations: [valuation._id]
  })
  const type = await seed.createTypeV2({
    characteristics: [characteristic._id]
  })
  const indicatorInstance = await seed.createIndicatorInstanceV2({ gad })
  const sub = await seed.createSubindicatorV2({
    indicatorInstance,
    type
  })
  return { gad, valuation, characteristic, type, indicatorInstance, sub }
}

describe('GET /api/v2/evidences (público: solo verificadas)', () => {
  test('200 envelope { data } lista vacia', async () => {
    const res = await api.get('/api/v2/evidences').expect(200)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data).toHaveLength(0)
  })

  test('200 lista con una evidencia verificada', async () => {
    await seed.createEvidenceV2({ verified: true })
    const res = await api.get('/api/v2/evidences').expect(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].id).toBeDefined()
    expect(res.body.data[0].kind).toBeDefined()
  })

  test('público NO ve las NO verificadas', async () => {
    await seed.createEvidenceV2({ verified: true })
    await seed.createEvidenceV2({ verified: false })
    const res = await api.get('/api/v2/evidences').expect(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].verified).toBe(true)
  })

  test('admin con ?includeUnverified=true ve TODAS', async () => {
    const { token } = await adminAuth()
    await seed.createEvidenceV2({ verified: true })
    await seed.createEvidenceV2({ verified: false })
    const res = await api
      .get('/api/v2/evidences?includeUnverified=true')
      .set('Authorization', bearer(token))
      .expect(200)
    expect(res.body.data).toHaveLength(2)
  })

  test('includeUnverified sin permiso (ciudadano) se ignora', async () => {
    const { token } = await citizenAuth()
    await seed.createEvidenceV2({ verified: true })
    await seed.createEvidenceV2({ verified: false })
    const res = await api
      .get('/api/v2/evidences?includeUnverified=true')
      .set('Authorization', bearer(token))
      .expect(200)
    expect(res.body.data).toHaveLength(1)
  })

  test('filtra por ?subindicator= (solo verificadas)', async () => {
    const { sub } = await seedGraphV2()
    await seed.createEvidenceV2({ subindicator: sub, verified: true })
    await seed.createEvidenceV2({ verified: true })
    const res = await api
      .get(`/api/v2/evidences?subindicator=${sub._id}`)
      .expect(200)
    expect(res.body.data).toHaveLength(1)
  })

  test('filtra por ?characteristic= (solo verificadas)', async () => {
    const { characteristic } = await seedGraphV2()
    await seed.createEvidenceV2({ characteristic, verified: true })
    await seed.createEvidenceV2({ verified: true })
    const res = await api
      .get(`/api/v2/evidences?characteristic=${characteristic._id}`)
      .expect(200)
    expect(res.body.data).toHaveLength(1)
  })

  test('paginacion: meta.pagination', async () => {
    for (let i = 0; i < 3; i++) await seed.createEvidenceV2({ verified: true })
    const res = await api
      .get('/api/v2/evidences?page=1&size=2')
      .expect(200)
    expect(res.body.data).toHaveLength(2)
    expect(res.body.meta.pagination.total).toBe(3)
  })

  test('400 VALIDATION_ERROR size invalido', async () => {
    const res = await api.get('/api/v2/evidences?size=0').expect(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('GET /api/v2/evidences/:id (público: solo verificadas)', () => {
  test('200 devuelve evidencia verificada', async () => {
    const ev = await seed.createEvidenceV2({ verified: true })
    const res = await api.get(`/api/v2/evidences/${ev._id}`).expect(200)
    expect(res.body.data.id).toBe(ev._id.toString())
    expect(res.body.data.kind).toBeDefined()
  })

  test('404 público en evidencia NO verificada (no se revela)', async () => {
    const ev = await seed.createEvidenceV2({ verified: false })
    const res = await api.get(`/api/v2/evidences/${ev._id}`).expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })

  test('200 admin SÍ ve la NO verificada', async () => {
    const { token } = await adminAuth()
    const ev = await seed.createEvidenceV2({ verified: false })
    const res = await api
      .get(`/api/v2/evidences/${ev._id}`)
      .set('Authorization', bearer(token))
      .expect(200)
    expect(res.body.data.id).toBe(ev._id.toString())
  })

  test('404 NOT_FOUND', async () => {
    const res = await api
      .get('/api/v2/evidences/646172dcdc1f126cd5207c05')
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })

  test('400 INVALID_ID', async () => {
    const res = await api.get('/api/v2/evidences/bad').expect(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('POST /api/v2/evidences (evidence:upload)', () => {
  test('401 sin token', async () => {
    const { sub, characteristic } = await seedGraphV2()
    const res = await api
      .post('/api/v2/evidences')
      .send({
        characteristicId: characteristic._id.toString(),
        subindicatorId: sub._id.toString(),
        name: 'Ev',
        link: 'http://test'
      })
      .expect(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  test('403 Ciudadano sin evidence:upload', async () => {
    const { token } = await citizenAuth()
    const { sub, characteristic } = await seedGraphV2()
    const res = await api
      .post('/api/v2/evidences')
      .set('Authorization', bearer(token))
      .send({
        characteristicId: characteristic._id.toString(),
        subindicatorId: sub._id.toString(),
        name: 'Ev',
        link: 'http://test'
      })
      .expect(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })

  test('201 crea evidencia con author desde token (Responsable)', async () => {
    const { token, user } = await responsibleAuth()
    const { sub, characteristic } = await seedGraphV2()
    const res = await api
      .post('/api/v2/evidences')
      .set('Authorization', bearer(token))
      .send({
        characteristicId: characteristic._id.toString(),
        subindicatorId: sub._id.toString(),
        name: 'Evidencia Nueva',
        link: 'http://test/doc.pdf',
        kind: 'principal',
        note: 'una nota'
      })
      .expect(201)
    expect(res.body.data.id).toBeDefined()
    expect(res.body.data.name).toBe('Evidencia Nueva')
    expect(res.body.data.kind).toBe('principal')
    // author SIEMPRE del token, no del body
    expect(res.body.data.author).toBe(user._id.toString())
    expect(res.body.data.verified).toBe(false)
  })

  test('201 crea evidencia complementaria con sourceId y pages', async () => {
    const { token, user } = await adminAuth()
    const { sub, characteristic } = await seedGraphV2()
    const gad = await seed.createGadV2()
    const sourceDoc = await seed.createSourceDocumentV2({ gad })
    const res = await api
      .post('/api/v2/evidences')
      .set('Authorization', bearer(token))
      .send({
        characteristicId: characteristic._id.toString(),
        subindicatorId: sub._id.toString(),
        name: 'Referencia POA',
        // link puede omitirse si sourceId esta presente
        sourceId: sourceDoc._id.toString(),
        pages: '12-15',
        kind: 'complementaria'
      })
      .expect(201)
    expect(res.body.data.kind).toBe('complementaria')
    expect(res.body.data.sourceId).toBe(sourceDoc._id.toString())
    expect(res.body.data.pages).toBe('12-15')
    expect(res.body.data.author).toBe(user._id.toString())
  })

  test('400 VALIDATION_ERROR sin link ni sourceId', async () => {
    const { token } = await responsibleAuth()
    const { sub, characteristic } = await seedGraphV2()
    const res = await api
      .post('/api/v2/evidences')
      .set('Authorization', bearer(token))
      .send({
        characteristicId: characteristic._id.toString(),
        subindicatorId: sub._id.toString(),
        name: 'Ev sin link'
      })
      .expect(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  test('400 VALIDATION_ERROR body invalido (sin name)', async () => {
    const { token } = await responsibleAuth()
    const { sub, characteristic } = await seedGraphV2()
    const res = await api
      .post('/api/v2/evidences')
      .set('Authorization', bearer(token))
      .send({
        characteristicId: characteristic._id.toString(),
        subindicatorId: sub._id.toString(),
        link: 'http://test'
      })
      .expect(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  test('author SIEMPRE del token (ignora author en body)', async () => {
    const { token, user } = await adminAuth()
    const { sub, characteristic } = await seedGraphV2()
    const otherUser = await seed.createUserV2()
    const res = await api
      .post('/api/v2/evidences')
      .set('Authorization', bearer(token))
      .send({
        characteristicId: characteristic._id.toString(),
        subindicatorId: sub._id.toString(),
        name: 'Ev',
        link: 'http://test',
        // Intentar inyectar un author diferente en el body (debe ignorarse)
        author: otherUser.user._id.toString()
      })
      .expect(201)
    // El author debe ser el del token, no el del body
    expect(res.body.data.author).toBe(user._id.toString())
  })
})

describe('PUT /api/v2/evidences/:id (evidence:upload)', () => {
  test('200 actualiza metadatos', async () => {
    const { token } = await adminAuth()
    const ev = await seed.createEvidenceV2()
    const res = await api
      .put(`/api/v2/evidences/${ev._id}`)
      .set('Authorization', bearer(token))
      .send({ name: 'Nombre Editado', kind: 'complementaria' })
      .expect(200)
    expect(res.body.data.name).toBe('Nombre Editado')
    expect(res.body.data.kind).toBe('complementaria')
  })

  test('404 NOT_FOUND', async () => {
    const { token } = await adminAuth()
    const res = await api
      .put('/api/v2/evidences/646172dcdc1f126cd5207c05')
      .set('Authorization', bearer(token))
      .send({ name: 'x' })
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })

  test('400 sin campos a actualizar', async () => {
    const { token } = await adminAuth()
    const ev = await seed.createEvidenceV2()
    const res = await api
      .put(`/api/v2/evidences/${ev._id}`)
      .set('Authorization', bearer(token))
      .send({})
      .expect(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  test('401 sin token', async () => {
    const ev = await seed.createEvidenceV2()
    const res = await api
      .put(`/api/v2/evidences/${ev._id}`)
      .send({ name: 'x' })
      .expect(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })
})

describe('DELETE /api/v2/evidences/:id (evidence:qualify)', () => {
  test('204 elimina (Administrador con evidence:qualify)', async () => {
    const { token } = await adminAuth()
    const ev = await seed.createEvidenceV2()
    await api
      .delete(`/api/v2/evidences/${ev._id}`)
      .set('Authorization', bearer(token))
      .expect(204)
    expect(await Evidence.findById(ev._id)).toBeNull()
  })

  test('403 Responsable sin evidence:qualify', async () => {
    const { token } = await responsibleAuth()
    const ev = await seed.createEvidenceV2()
    const res = await api
      .delete(`/api/v2/evidences/${ev._id}`)
      .set('Authorization', bearer(token))
      .expect(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })

  test('404 NOT_FOUND', async () => {
    const { token } = await adminAuth()
    const res = await api
      .delete('/api/v2/evidences/646172dcdc1f126cd5207c05')
      .set('Authorization', bearer(token))
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })

  test('401 sin token', async () => {
    const ev = await seed.createEvidenceV2()
    const res = await api
      .delete(`/api/v2/evidences/${ev._id}`)
      .expect(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })
})

describe('PUT /api/v2/evidences/:id/qualify (evidence:qualify, segregacion)', () => {
  test('401 sin token', async () => {
    const ev = await seed.createEvidenceV2()
    const res = await api
      .put(`/api/v2/evidences/${ev._id}/qualify`)
      .send({ criteria: [] })
      .expect(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  test('403 Responsable sin evidence:qualify', async () => {
    const { token } = await responsibleAuth()
    const ev = await seed.createEvidenceV2()
    const res = await api
      .put(`/api/v2/evidences/${ev._id}/qualify`)
      .set('Authorization', bearer(token))
      .send({ criteria: [] })
      .expect(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })

  test('403 segregacion: el autor no puede calificar su propia evidencia', async () => {
    const { token, user } = await adminAuth()
    // Crear evidencia con el mismo usuario como author
    const ev = await seed.createEvidenceV2({ author: user._id })
    const res = await api
      .put(`/api/v2/evidences/${ev._id}/qualify`)
      .set('Authorization', bearer(token))
      .send({ criteria: [] })
      .expect(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
    expect(res.body.error.message).toMatch(/author.*cannot qualify|cannot qualify.*own/i)
  })

  test('200 califica y crea CharacteristicAssessmentV2', async () => {
    // Evaluador (admin) y autor distintos
    const { token: qualifierToken } = await adminAuth()
    const { user: authorUser } = await responsibleAuth()
    const { sub, characteristic, valuation } = await seedGraphV2()

    const ev = await seed.createEvidenceV2({
      subindicator: sub,
      characteristic,
      author: authorUser._id
    })

    const res = await api
      .put(`/api/v2/evidences/${ev._id}/qualify`)
      .set('Authorization', bearer(qualifierToken))
      .send({
        criteria: [
          { valuationId: valuation._id.toString(), met: true, weight: 1 }
        ]
      })
      .expect(200)

    expect(res.body.data.assessment).toBeDefined()
    expect(res.body.data.assessment.score).toBe(1)
    expect(res.body.data.assessment.totalRubric).toBe(1)
    expect(res.body.data.assessment.criteria).toHaveLength(1)
    expect(res.body.data.assessment.criteria[0].met).toBe(true)

    // Verificar que se creo el assessment en la BD
    const assessment = await CharacteristicAssessment.findOne({
      subindicatorId: sub._id,
      characteristicId: characteristic._id
    })
    expect(assessment).not.toBeNull()
    expect(assessment.score).toBe(1)
  })

  test('200 re-califica: actualiza el assessment existente', async () => {
    const { token: qualifierToken } = await adminAuth()
    const { user: authorUser } = await responsibleAuth()
    const { sub, characteristic, valuation } = await seedGraphV2()

    const ev = await seed.createEvidenceV2({
      subindicator: sub,
      characteristic,
      author: authorUser._id
    })

    // Primera calificacion
    await api
      .put(`/api/v2/evidences/${ev._id}/qualify`)
      .set('Authorization', bearer(qualifierToken))
      .send({
        criteria: [
          { valuationId: valuation._id.toString(), met: false, weight: 1 }
        ]
      })
      .expect(200)

    // Segunda calificacion (re-califica)
    const res2 = await api
      .put(`/api/v2/evidences/${ev._id}/qualify`)
      .set('Authorization', bearer(qualifierToken))
      .send({
        criteria: [
          { valuationId: valuation._id.toString(), met: true, weight: 1 }
        ]
      })
      .expect(200)

    expect(res2.body.data.assessment.score).toBe(1)

    // Solo debe haber UN assessment (upsert, no duplicado)
    const count = await CharacteristicAssessment.countDocuments({
      subindicatorId: sub._id,
      characteristicId: characteristic._id
    })
    expect(count).toBe(1)
  })

  test('404 qualify sobre evidencia inexistente', async () => {
    const { token } = await adminAuth()
    const res = await api
      .put('/api/v2/evidences/646172dcdc1f126cd5207c05/qualify')
      .set('Authorization', bearer(token))
      .send({ criteria: [] })
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })

  test('400 VALIDATION_ERROR criteria invalido', async () => {
    const { token } = await adminAuth()
    const ev = await seed.createEvidenceV2()
    const res = await api
      .put(`/api/v2/evidences/${ev._id}/qualify`)
      .set('Authorization', bearer(token))
      .send({ criteria: 'no-es-array' })
      .expect(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  // M5: valuationId que no pertenece a la caracteristica -> 400
  test('400 VALIDATION_ERROR si valuationId no pertenece a la caracteristica (M5)', async () => {
    const { token: qualifierToken } = await adminAuth()
    const { user: authorUser } = await responsibleAuth()
    const { sub, characteristic } = await seedGraphV2()

    const ev = await seed.createEvidenceV2({
      subindicator: sub,
      characteristic,
      author: authorUser._id
    })

    // Crear una valuacion que NO pertenece a la caracteristica de la evidencia
    const foreignValuation = await seed.createValuationV2({ maxValue: 5 })

    const res = await api
      .put(`/api/v2/evidences/${ev._id}/qualify`)
      .set('Authorization', bearer(qualifierToken))
      .send({
        criteria: [
          { valuationId: foreignValuation._id.toString(), met: true }
        ]
      })
      .expect(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('PATCH /api/v2/evidences/:id/publish (evidence:publish)', () => {
  test('401 sin token', async () => {
    const ev = await seed.createEvidenceV2()
    const res = await api
      .patch(`/api/v2/evidences/${ev._id}/publish`)
      .send({ verified: true })
      .expect(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  test('403 Responsable sin evidence:publish', async () => {
    const { token } = await responsibleAuth()
    const ev = await seed.createEvidenceV2()
    const res = await api
      .patch(`/api/v2/evidences/${ev._id}/publish`)
      .set('Authorization', bearer(token))
      .send({ verified: true })
      .expect(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })

  test('200 publica (verified=true)', async () => {
    const { token } = await adminAuth()
    const ev = await seed.createEvidenceV2({ verified: false })
    const res = await api
      .patch(`/api/v2/evidences/${ev._id}/publish`)
      .set('Authorization', bearer(token))
      .send({ verified: true })
      .expect(200)
    expect(res.body.data.verified).toBe(true)
  })

  test('200 despublica (verified=false)', async () => {
    const { token } = await adminAuth()
    const ev = await seed.createEvidenceV2({ verified: true })
    const res = await api
      .patch(`/api/v2/evidences/${ev._id}/publish`)
      .set('Authorization', bearer(token))
      .send({ verified: false })
      .expect(200)
    expect(res.body.data.verified).toBe(false)
  })

  test('404 NOT_FOUND', async () => {
    const { token } = await adminAuth()
    const res = await api
      .patch('/api/v2/evidences/646172dcdc1f126cd5207c05/publish')
      .set('Authorization', bearer(token))
      .send({ verified: true })
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })

  test('400 VALIDATION_ERROR sin body', async () => {
    const { token } = await adminAuth()
    const ev = await seed.createEvidenceV2()
    const res = await api
      .patch(`/api/v2/evidences/${ev._id}/publish`)
      .set('Authorization', bearer(token))
      .send({})
      .expect(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('GET /api/v2/subindicators/:id/assessments', () => {
  test('200 lista assessments de un subindicador', async () => {
    const { sub, characteristic } = await seedGraphV2()
    await seed.createCharacteristicAssessmentV2({
      subindicator: sub,
      characteristic
    })
    const res = await api
      .get(`/api/v2/subindicators/${sub._id}/assessments`)
      .expect(200)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data).toHaveLength(1)
  })

  test('200 lista vacia si no hay assessments', async () => {
    const { sub } = await seedGraphV2()
    const res = await api
      .get(`/api/v2/subindicators/${sub._id}/assessments`)
      .expect(200)
    expect(res.body.data).toHaveLength(0)
  })

  test('GET por characteristicId: 200', async () => {
    const { sub, characteristic } = await seedGraphV2()
    await seed.createCharacteristicAssessmentV2({
      subindicator: sub,
      characteristic
    })
    const res = await api
      .get(`/api/v2/subindicators/${sub._id}/assessments/${characteristic._id}`)
      .expect(200)
    expect(res.body.data.subindicatorId).toBe(sub._id.toString())
    expect(res.body.data.characteristicId).toBeDefined()
  })

  test('GET por characteristicId: 404 si no existe', async () => {
    const { sub } = await seedGraphV2()
    const res = await api
      .get(`/api/v2/subindicators/${sub._id}/assessments/646172dcdc1f126cd5207c05`)
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })
})

// ---------------------------------------------------------------------------
// Integracion: qualify + recompute del semaforo (Tema 4)
// ---------------------------------------------------------------------------

describe('Integracion: qualify dispara recompute del semaforo', () => {
  // Construye el grafo v2 completo con umbrales de semaforo para poder verificar
  // la qualification resultante.
  const seedGraphWithThresholds = async () => {
    const gad = await seed.createGadV2()
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
    const indicatorInstance = await seed.createIndicatorInstanceV2({ gad })
    const sub = await seed.createSubindicatorV2({
      indicatorInstance,
      type
    })
    // Enlazar subindicador a la instancia
    await IndicatorInstance.findByIdAndUpdate(indicatorInstance._id, {
      subindicators: [sub._id]
    })
    return { gad, valuation, characteristic, type, indicatorInstance, sub }
  }

  test('tras qualify con criterio cumplido + assessment verified, subindicador pasa a 3', async () => {
    const { token: qualifierToken } = await adminAuth()
    const { user: authorUser } = await responsibleAuth()
    const { sub, characteristic, valuation, indicatorInstance } = await seedGraphWithThresholds()

    const ev = await seed.createEvidenceV2({
      subindicator: sub,
      characteristic,
      author: authorUser._id
    })

    // Calificar: un criterio met=true, weight=1
    await api
      .put(`/api/v2/evidences/${ev._id}/qualify`)
      .set('Authorization', bearer(qualifierToken))
      .send({
        criteria: [
          { valuationId: valuation._id.toString(), met: true, weight: 1 }
        ]
      })
      .expect(200)

    // El assessment queda sin verificar por defecto (verified=false) ->
    // el recompute no debe cambiar la qualification todavia.
    const subAfterQualify = await Subindicator.findById(sub._id)
    expect(subAfterQualify.qualification).toBe(0) // sin verificar = 0

    // Verificar el assessment para que puntue
    await CharacteristicAssessment.findOneAndUpdate(
      { subindicatorId: sub._id, characteristicId: characteristic._id },
      { verified: true }
    )

    // Publicar la evidencia (PATCH /publish) dispara otro recompute
    await api
      .patch(`/api/v2/evidences/${ev._id}/publish`)
      .set('Authorization', bearer(qualifierToken))
      .send({ verified: true })
      .expect(200)

    const subAfterPublish = await Subindicator.findById(sub._id)
    const instAfterPublish = await IndicatorInstance.findById(indicatorInstance._id)

    // Assessment verificado con 100% -> verde (3)
    expect(subAfterPublish.qualification).toBe(3)
    expect(instAfterPublish.qualification).toBe(3)
  })

  test('tras delete de evidencia, el semaforo se recomputa', async () => {
    const { token: qualifierToken } = await adminAuth()
    const { user: authorUser } = await responsibleAuth()
    const { sub, characteristic, valuation, indicatorInstance } = await seedGraphWithThresholds()

    // Crear assessment verificado manualmente para que el sub tenga qual=3
    const ev = await seed.createEvidenceV2({
      subindicator: sub,
      characteristic,
      author: authorUser._id
    })
    await new CharacteristicAssessment({
      subindicatorId: sub._id,
      characteristicId: characteristic._id,
      criteria: [{ valuationId: valuation._id, met: true, weight: 1 }],
      score: 1,
      totalRubric: 1,
      verified: true,
      sourceOverrides: [],
      qualifiedAt: new Date(),
      qualifiedBy: sub.createdBy
    }).save()
    await Subindicator.findByIdAndUpdate(sub._id, { qualification: 3 })
    await IndicatorInstance.findByIdAndUpdate(indicatorInstance._id, {
      subindicators: [sub._id]
    })

    // Eliminar el assessment verificado para simular borrado
    await CharacteristicAssessment.deleteMany({ subindicatorId: sub._id })

    // Borrar la evidencia -> dispara recompute
    await api
      .delete(`/api/v2/evidences/${ev._id}`)
      .set('Authorization', bearer(qualifierToken))
      .expect(204)

    const subAfterDelete = await Subindicator.findById(sub._id)
    // Sin assessments verificados -> 0
    expect(subAfterDelete.qualification).toBe(0)
  })
})
