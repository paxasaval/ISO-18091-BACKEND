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

describe('GET /api/indicatorsInstance/:id', () => {
  test('devuelve la instancia con id', async () => {
    const instance = await seed.createIndicatorInstance()
    const res = await api
      .get(`/api/indicatorsInstance/${instance._id}`)
      .expect(200)
    expect(res.body.id).toBe(instance._id.toString())
    expect(res.body._id).toBeUndefined()
  })

  test('404 cuando no existe', async () => {
    await api
      .get('/api/indicatorsInstance/646172dcdc1f126cd5207c05')
      .expect(404)
  })
})

describe('GET /api/indicatorsInstance/byIndicatorIDAndPeriod', () => {
  test('devuelve la instancia que coincide', async () => {
    const gad = await seed.createGad()
    const indicator = await seed.createIndicator()
    const period = await seed.createPeriod({ gad })
    const instance = await seed.createIndicatorInstance({
      gadID: gad,
      indicatorID: indicator,
      period
    })
    const res = await api
      .get('/api/indicatorsInstance/byIndicatorIDAndPeriod')
      .query({ indicatorID: indicator._id.toString(), period: period._id.toString() })
      .set('tenant', gad._id.toString())
      .expect(200)
    expect(res.body.id).toBe(instance._id.toString())
  })
})

describe('GET /api/indicatorsInstance/summarySubindicators', () => {
  test('devuelve conteo por calificacion', async () => {
    const gad = await seed.createGad()
    const period = await seed.createPeriod({ gad })
    await seed.createIndicatorInstance({ gadID: gad, period })
    const res = await api
      .get('/api/indicatorsInstance/summarySubindicators')
      .query({ period: period._id.toString() })
      .set('tenant', gad._id.toString())
      .expect(200)
    expect(res.body).toHaveProperty('qualify_0')
    expect(res.body).toHaveProperty('qualify_3')
  })
})

describe('PUT /api/indicatorsInstance/:id (auth)', () => {
  // Legacy: sin token jwt.verify lanza -> 400 'invalid token' (no 401).
  test('400 sin token (jwt invalido)', async () => {
    const instance = await seed.createIndicatorInstance()
    await api
      .put(`/api/indicatorsInstance/${instance._id}`)
      .send({ qualification: 2, subindicators: [] })
      .expect(400)
  })

  test('401 con rol no admin', async () => {
    const rol = await seed.createRol({ name: process.env.ROL_USER })
    const { user } = await seed.createUser({ rol })
    const instance = await seed.createIndicatorInstance()
    const token = seed.signToken({ id: user.id, rol: rol._id.toString() })
    const res = await api
      .put(`/api/indicatorsInstance/${instance._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ qualification: 2, subindicators: [] })
      .expect(401)
    expect(res.body.error).toBe('unauthorized rol')
  })

  test('200 con rol admin', async () => {
    const rol = await seed.createRol({ name: process.env.ROL_ADMIN })
    const { user } = await seed.createUser({ rol })
    const instance = await seed.createIndicatorInstance()
    const token = seed.signToken({ id: user.id, rol: rol._id.toString() })
    const res = await api
      .put(`/api/indicatorsInstance/${instance._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ qualification: 2, subindicators: [] })
      .expect(200)
    expect(res.body.qualification).toBe(2)
  })
})

describe('DELETE /api/indicatorsInstance/:id', () => {
  test('elimina con 204', async () => {
    const instance = await seed.createIndicatorInstance()
    await api.delete(`/api/indicatorsInstance/${instance._id}`).expect(204)
  })
})
