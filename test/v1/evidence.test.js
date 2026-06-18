const supertest = require('supertest')
const app = require('../../app')
const db = require('../helpers/db')
const seed = require('../helpers/seed')

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

describe('GET /api/evidences', () => {
  test('devuelve evidencias', async () => {
    await seed.createEvidence()
    const res = await api.get('/api/evidences').expect(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].id).toBeDefined()
  })
})

describe('GET /api/evidences/subindicatorID/:id', () => {
  test('devuelve evidencias del subindicador', async () => {
    const sub = await seed.createSubIndicator()
    await seed.createEvidence({ subIndicatorID: sub })
    const res = await api
      .get(`/api/evidences/subindicatorID/${sub._id}`)
      .expect(200)
    expect(res.body).toHaveLength(1)
  })
})

describe('GET /api/evidences/:id', () => {
  test('devuelve la evidencia', async () => {
    const evidence = await seed.createEvidence()
    const res = await api.get(`/api/evidences/${evidence._id}`).expect(200)
    expect(res.body.id).toBe(evidence._id.toString())
  })

  test('404 cuando no existe', async () => {
    await api.get('/api/evidences/646172dcdc1f126cd5207c05').expect(404)
  })
})

describe('POST /api/evidences (auth)', () => {
  // Legacy: sin token jwt.verify lanza -> 400 'invalid token' (no 401).
  test('400 sin token (jwt invalido)', async () => {
    const res = await api
      .post('/api/evidences')
      .send({ name: 'x' })
      .expect(400)
    expect(res.body.error).toBe('invalid token')
  })

  test('401 con rol no autorizado (ROL_USER)', async () => {
    const rol = await seed.createRol({ name: process.env.ROL_USER })
    const { user } = await seed.createUser({ rol })
    const token = seed.signToken({ id: user.id, rol: rol._id.toString() })
    const res = await api
      .post('/api/evidences')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'x' })
      .expect(401)
    expect(res.body.error).toBe('unauthorized rol')
  })
})

describe('PUT /api/evidences/qualify/:id (auth)', () => {
  test('400 sin token (jwt invalido)', async () => {
    const evidence = await seed.createEvidence()
    await api
      .put(`/api/evidences/qualify/${evidence._id}`)
      .send({ qualification: 3, rubric: [] })
      .expect(400)
  })

  test('401 con rol no admin', async () => {
    const rol = await seed.createRol({ name: process.env.ROL_USER })
    const { user } = await seed.createUser({ rol })
    const evidence = await seed.createEvidence()
    const token = seed.signToken({ id: user.id, rol: rol._id.toString() })
    const res = await api
      .put(`/api/evidences/qualify/${evidence._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ qualification: 3, rubric: [] })
      .expect(401)
    expect(res.body.error).toBe('unauthorized rol')
  })
})

describe('DELETE /api/evidences/:id (auth)', () => {
  test('400 sin token (jwt invalido)', async () => {
    const evidence = await seed.createEvidence()
    await api.delete(`/api/evidences/${evidence._id}`).expect(400)
  })
})

describe('PUT /api/evidences/:id', () => {
  test('actualiza la evidencia (sin auth)', async () => {
    const evidence = await seed.createEvidence()
    const res = await api
      .put(`/api/evidences/${evidence._id}`)
      .send({
        name: 'Editada',
        characteristicID: evidence.characteristicID,
        subIndicatorID: evidence.subIndicatorID,
        link: 'http://x',
        note: 'n'
      })
      .expect(200)
    expect(res.body.name).toBe('Editada')
  })
})
