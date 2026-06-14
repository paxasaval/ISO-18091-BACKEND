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

describe('GET /api/subIndicators/all', () => {
  test('devuelve todos los subindicadores con id', async () => {
    await seed.createSubIndicator()
    const res = await api.get('/api/subIndicators/all').expect(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].id).toBeDefined()
    expect(res.body[0]._id).toBeUndefined()
  })
})

describe('GET /api/subIndicators (paginado)', () => {
  test('devuelve estructura paginada (docs + metadata)', async () => {
    await seed.createSubIndicator()
    await seed.createSubIndicator()
    const res = await api.get('/api/subIndicators?page=0&size=1').expect(200)
    expect(res.body.docs).toBeDefined()
    expect(res.body.docs).toHaveLength(1)
    expect(res.body.totalDocs).toBe(2)
    expect(res.body.limit).toBe(1)
  })
})

describe('GET /api/subIndicators/indicator/:id', () => {
  test('paginado filtrado por indicador', async () => {
    const instance = await seed.createIndicatorInstance()
    await seed.createSubIndicator({ indicadorID: instance })
    const res = await api
      .get(`/api/subIndicators/indicator/${instance._id}?page=0&size=3`)
      .expect(200)
    expect(res.body.docs).toHaveLength(1)
    expect(res.body.totalDocs).toBe(1)
  })
})

describe('GET /api/subIndicators/indicator/:id/all', () => {
  test('devuelve subindicadores del indicador sin paginar', async () => {
    const instance = await seed.createIndicatorInstance()
    await seed.createSubIndicator({ indicadorID: instance })
    const res = await api
      .get(`/api/subIndicators/indicator/${instance._id}/all`)
      .expect(200)
    expect(res.body).toHaveLength(1)
  })
})

describe('GET /api/subIndicators/:id', () => {
  test('devuelve el subindicador', async () => {
    const sub = await seed.createSubIndicator()
    const res = await api.get(`/api/subIndicators/${sub._id}`).expect(200)
    expect(res.body.id).toBe(sub._id.toString())
  })

  test('404 cuando no existe', async () => {
    await api.get('/api/subIndicators/646172dcdc1f126cd5207c05').expect(404)
  })
})

describe('POST /api/subIndicators/newSubindicator (auth)', () => {
  // Legacy: sin token jwt.verify lanza -> 400 'invalid token' (no 401).
  test('400 sin token (jwt invalido)', async () => {
    const res = await api
      .post('/api/subIndicators/newSubindicator')
      .send({ name: 'x', commits: [], evidences: [] })
      .expect(400)
    expect(res.body.error).toBe('invalid token')
  })

  test('401 con rol no autorizado (ROL_USER)', async () => {
    const rol = await seed.createRol({ name: process.env.ROL_USER })
    const { user } = await seed.createUser({ rol })
    const token = seed.signToken({ id: user.id, rol: rol._id.toString() })
    const res = await api
      .post('/api/subIndicators/newSubindicator')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'x', commits: [], evidences: [] })
      .expect(401)
    expect(res.body.error).toBe('unauthorized rol')
  })
})

describe('DELETE /api/subIndicators/:id', () => {
  test('elimina con 204', async () => {
    const sub = await seed.createSubIndicator()
    await api.delete(`/api/subIndicators/${sub._id}`).expect(204)
  })
})
