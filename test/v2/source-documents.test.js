const supertest = require('supertest')
const app = require('../../app')
const db = require('../helpers/db')
const seed = require('../helpers/seed-v2')
const SourceDocument = require('../../src/v2/models/source-document.model')
const Evidence = require('../../src/v2/models/evidence.model')
const CharacteristicAssessment = require('../../src/v2/models/characteristic-assessment.model')

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

// Crea un usuario con permiso evidence:upload (Responsable o Administrador).
const uploaderAuth = async () => {
  const rol = await seed.createRolV2({ name: 'Administrador' })
  const { user } = await seed.createUserV2({ rol })
  const token = seed.signToken({ id: user._id.toString(), rol: rol._id.toString() })
  return { rol, user, token }
}

// Crea un usuario con permiso evidence:publish (solo Administrador).
const publisherAuth = async () => {
  const rol = await seed.createRolV2({ name: 'Administrador' })
  const { user } = await seed.createUserV2({ rol })
  const token = seed.signToken({ id: user._id.toString(), rol: rol._id.toString() })
  return { rol, user, token }
}

// Ciudadano: sin permisos de upload ni publish.
const citizenAuth = async () => {
  const rol = await seed.createRolV2({ name: 'Ciudadano' })
  const { user } = await seed.createUserV2({ rol })
  const token = seed.signToken({ id: user._id.toString(), rol: rol._id.toString() })
  return { rol, user, token }
}

describe('GET /api/v2/source-documents', () => {
  test('200 envelope { data } lista vacia', async () => {
    const res = await api.get('/api/v2/source-documents').expect(200)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data).toHaveLength(0)
  })

  test('200 lista con un documento', async () => {
    await seed.createSourceDocumentV2()
    const res = await api.get('/api/v2/source-documents').expect(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].id).toBeDefined()
    expect(res.body.data[0].name).toBeDefined()
  })

  test('filtra por ?gad=', async () => {
    const gad1 = await seed.createGadV2()
    const gad2 = await seed.createGadV2()
    await seed.createSourceDocumentV2({ gad: gad1 })
    await seed.createSourceDocumentV2({ gad: gad2 })
    const res = await api
      .get(`/api/v2/source-documents?gad=${gad1._id}`)
      .expect(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].gadId).toBe(gad1._id.toString())
  })

  test('filtra por ?year=', async () => {
    await seed.createSourceDocumentV2({ year: '2025' })
    await seed.createSourceDocumentV2({ year: '2026' })
    const res = await api
      .get('/api/v2/source-documents?year=2025')
      .expect(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].year).toBe('2025')
  })

  test('paginacion: meta.pagination', async () => {
    for (let i = 0; i < 3; i++) await seed.createSourceDocumentV2()
    const res = await api
      .get('/api/v2/source-documents?page=1&size=2')
      .expect(200)
    expect(res.body.data).toHaveLength(2)
    expect(res.body.meta.pagination.total).toBe(3)
    expect(res.body.meta.pagination.totalPages).toBe(2)
  })

  test('400 VALIDATION_ERROR con size=0', async () => {
    const res = await api.get('/api/v2/source-documents?size=0').expect(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('GET /api/v2/source-documents/:id', () => {
  test('200 devuelve el documento', async () => {
    const doc = await seed.createSourceDocumentV2()
    const res = await api
      .get(`/api/v2/source-documents/${doc._id}`)
      .expect(200)
    expect(res.body.data.id).toBe(doc._id.toString())
    expect(res.body.data.name).toBe(doc.name)
  })

  test('404 NOT_FOUND', async () => {
    const res = await api
      .get('/api/v2/source-documents/646172dcdc1f126cd5207c05')
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })

  test('400 INVALID_ID', async () => {
    const res = await api
      .get('/api/v2/source-documents/invalid')
      .expect(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('POST /api/v2/source-documents', () => {
  test('401 sin token', async () => {
    const gad = await seed.createGadV2()
    const res = await api
      .post('/api/v2/source-documents')
      .send({ gadId: gad._id.toString(), name: 'POA', link: 'http://test' })
      .expect(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  test('403 Ciudadano sin permiso evidence:upload', async () => {
    const { token } = await citizenAuth()
    const gad = await seed.createGadV2()
    const res = await api
      .post('/api/v2/source-documents')
      .set('Authorization', bearer(token))
      .send({ gadId: gad._id.toString(), name: 'POA', link: 'http://test' })
      .expect(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })

  test('201 crea con uploadedBy desde token', async () => {
    const { token, user } = await uploaderAuth()
    const gad = await seed.createGadV2()
    const res = await api
      .post('/api/v2/source-documents')
      .set('Authorization', bearer(token))
      .send({
        gadId: gad._id.toString(),
        name: 'POA 2026',
        link: 'http://test/poa.pdf',
        kind: 'poa',
        year: '2026'
      })
      .expect(201)
    expect(res.body.data.id).toBeDefined()
    expect(res.body.data.name).toBe('POA 2026')
    expect(res.body.data.year).toBe('2026')
    expect(res.body.data.verified).toBe(false)
    // uploadedBy debe ser el usuario del token
    expect(res.body.data.uploadedBy).toBe(user._id.toString())
  })

  test('400 VALIDATION_ERROR sin gadId', async () => {
    const { token } = await uploaderAuth()
    const res = await api
      .post('/api/v2/source-documents')
      .set('Authorization', bearer(token))
      .send({ name: 'POA', link: 'http://test' })
      .expect(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  test('400 VALIDATION_ERROR sin name', async () => {
    const { token } = await uploaderAuth()
    const gad = await seed.createGadV2()
    const res = await api
      .post('/api/v2/source-documents')
      .set('Authorization', bearer(token))
      .send({ gadId: gad._id.toString(), link: 'http://test' })
      .expect(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('PUT /api/v2/source-documents/:id', () => {
  test('200 actualiza nombre', async () => {
    const { token } = await uploaderAuth()
    const doc = await seed.createSourceDocumentV2()
    const res = await api
      .put(`/api/v2/source-documents/${doc._id}`)
      .set('Authorization', bearer(token))
      .send({ name: 'POA Actualizado' })
      .expect(200)
    expect(res.body.data.name).toBe('POA Actualizado')
  })

  test('404 NOT_FOUND', async () => {
    const { token } = await uploaderAuth()
    const res = await api
      .put('/api/v2/source-documents/646172dcdc1f126cd5207c05')
      .set('Authorization', bearer(token))
      .send({ name: 'x' })
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })

  test('401 sin token', async () => {
    const doc = await seed.createSourceDocumentV2()
    const res = await api
      .put(`/api/v2/source-documents/${doc._id}`)
      .send({ name: 'x' })
      .expect(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })
})

describe('DELETE /api/v2/source-documents/:id', () => {
  test('204 elimina', async () => {
    const { token } = await uploaderAuth()
    const doc = await seed.createSourceDocumentV2()
    await api
      .delete(`/api/v2/source-documents/${doc._id}`)
      .set('Authorization', bearer(token))
      .expect(204)
    expect(await SourceDocument.findById(doc._id)).toBeNull()
  })

  // B6: al borrar un source-document, las evidencias verificadas que lo referencian
  // quedan con verified=false y los assessments se sincronizan.
  test('B6: al eliminar, las evidencias verificadas se ponen en verified=false', async () => {
    const { token } = await uploaderAuth()
    const gad = await seed.createGadV2()
    const doc = await seed.createSourceDocumentV2({ gad })
    const sub = await seed.createSubindicatorV2()
    const ch = await seed.createCharacteristicV2()

    // Crear evidencia verificada que referencia al documento.
    const ev = await seed.createEvidenceV2({
      sourceId: doc._id,
      subindicator: sub,
      characteristic: ch,
      verified: true
    })

    // Crear assessment verificado para ese par.
    await seed.createCharacteristicAssessmentV2({
      subindicator: sub,
      characteristic: ch,
      verified: true
    })

    await api
      .delete(`/api/v2/source-documents/${doc._id}`)
      .set('Authorization', bearer(token))
      .expect(204)

    // La evidencia debe quedar con verified=false.
    const updatedEv = await Evidence.findById(ev._id)
    expect(updatedEv.verified).toBe(false)

    // El assessment debe haberse sincronizado a verified=false.
    const updatedAssessment = await CharacteristicAssessment.findOne({
      subindicatorId: sub._id,
      characteristicId: ch._id
    })
    expect(updatedAssessment.verified).toBe(false)
  })

  test('404 NOT_FOUND', async () => {
    const { token } = await uploaderAuth()
    const res = await api
      .delete('/api/v2/source-documents/646172dcdc1f126cd5207c05')
      .set('Authorization', bearer(token))
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })

  test('401 sin token', async () => {
    const doc = await seed.createSourceDocumentV2()
    const res = await api
      .delete(`/api/v2/source-documents/${doc._id}`)
      .expect(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })
})

describe('PATCH /api/v2/source-documents/:id/verify', () => {
  test('401 sin token', async () => {
    const doc = await seed.createSourceDocumentV2()
    const res = await api
      .patch(`/api/v2/source-documents/${doc._id}/verify`)
      .send({ verified: true })
      .expect(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  test('403 Ciudadano sin permiso evidence:publish', async () => {
    const { token } = await citizenAuth()
    const doc = await seed.createSourceDocumentV2()
    const res = await api
      .patch(`/api/v2/source-documents/${doc._id}/verify`)
      .set('Authorization', bearer(token))
      .send({ verified: true })
      .expect(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })

  test('200 marca verified=true', async () => {
    const { token } = await publisherAuth()
    const doc = await seed.createSourceDocumentV2()
    const res = await api
      .patch(`/api/v2/source-documents/${doc._id}/verify`)
      .set('Authorization', bearer(token))
      .send({ verified: true })
      .expect(200)
    expect(res.body.data.verified).toBe(true)
  })

  test('200 marca verified=false', async () => {
    const { token } = await publisherAuth()
    const doc = await seed.createSourceDocumentV2({ verified: true })
    const res = await api
      .patch(`/api/v2/source-documents/${doc._id}/verify`)
      .set('Authorization', bearer(token))
      .send({ verified: false })
      .expect(200)
    expect(res.body.data.verified).toBe(false)
  })

  test('propagacion: verifica fuente y propaga a evidencias referenciadas', async () => {
    const { token } = await publisherAuth()
    const gad = await seed.createGadV2()
    const doc = await seed.createSourceDocumentV2({ gad })
    // Crear dos evidencias que referencian este source document
    const ev1 = await seed.createEvidenceV2({ sourceId: doc._id, verified: false })
    const ev2 = await seed.createEvidenceV2({ sourceId: doc._id, verified: false })
    // Crear una evidencia sin sourceId (no debe propagarse)
    const ev3 = await seed.createEvidenceV2({ verified: false })

    await api
      .patch(`/api/v2/source-documents/${doc._id}/verify`)
      .set('Authorization', bearer(token))
      .send({ verified: true })
      .expect(200)

    // ev1 y ev2 deben tener verified=true
    const updatedEv1 = await Evidence.findById(ev1._id)
    const updatedEv2 = await Evidence.findById(ev2._id)
    const updatedEv3 = await Evidence.findById(ev3._id)
    expect(updatedEv1.verified).toBe(true)
    expect(updatedEv2.verified).toBe(true)
    // ev3 no tiene sourceId, no debe cambiar
    expect(updatedEv3.verified).toBe(false)
  })

  test('propagacion con override: NO propaga si la caracteristica tiene override', async () => {
    const { token } = await publisherAuth()
    const gad = await seed.createGadV2()
    const doc = await seed.createSourceDocumentV2({ gad })
    const sub = await seed.createSubindicatorV2()
    const ch = await seed.createCharacteristicV2()

    // Crear evidencia que referencia la fuente
    const ev = await seed.createEvidenceV2({
      sourceId: doc._id,
      subindicator: sub,
      characteristic: ch,
      verified: false
    })

    // Crear un assessment con override para esta fuente
    await seed.createCharacteristicAssessmentV2({
      subindicator: sub,
      characteristic: ch,
      sourceOverrides: [doc._id]
    })

    await api
      .patch(`/api/v2/source-documents/${doc._id}/verify`)
      .set('Authorization', bearer(token))
      .send({ verified: true })
      .expect(200)

    // La evidencia NO debe tener verified=true porque tiene override
    const updatedEv = await Evidence.findById(ev._id)
    expect(updatedEv.verified).toBe(false)
  })

  test('404 NOT_FOUND', async () => {
    const { token } = await publisherAuth()
    const res = await api
      .patch('/api/v2/source-documents/646172dcdc1f126cd5207c05/verify')
      .set('Authorization', bearer(token))
      .send({ verified: true })
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })

  test('400 VALIDATION_ERROR sin body verified', async () => {
    const { token } = await publisherAuth()
    const doc = await seed.createSourceDocumentV2()
    const res = await api
      .patch(`/api/v2/source-documents/${doc._id}/verify`)
      .set('Authorization', bearer(token))
      .send({})
      .expect(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})
