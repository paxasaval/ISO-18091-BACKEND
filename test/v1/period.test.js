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

describe('GET /api/period', () => {
  test('400 cuando falta tenant', async () => {
    const res = await api.get('/api/period').expect(400)
    expect(res.body.erro).toBe('tenat is nesesary')
  })

  test('devuelve periodos del tenant', async () => {
    const gad = await seed.createGad()
    await seed.createPeriod({ gad })
    const res = await api
      .get('/api/period')
      .set('tenant', gad._id.toString())
      .expect(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].id).toBeDefined()
  })
})

describe('GET /api/period/:id', () => {
  test('devuelve el periodo', async () => {
    const period = await seed.createPeriod()
    const res = await api.get(`/api/period/${period._id}`).expect(200)
    expect(res.body.id).toBe(period._id.toString())
  })
})

describe('POST /api/period (auth)', () => {
  test('400 cuando falta period en el body', async () => {
    const res = await api.post('/api/period').send({}).expect(400)
    expect(res.body.error).toBe('period is missing')
  })

  // Legacy: sin token jwt.verify lanza -> 400 'invalid token' (no 401).
  test('400 sin token (jwt invalido)', async () => {
    const res = await api.post('/api/period').send({ period: '2026' }).expect(400)
    expect(res.body.error).toBe('invalid token')
  })

  test('401 cuando el rol es admin (no autorizado en esta ruta)', async () => {
    const rol = await seed.createRol({ name: process.env.ROL_ADMIN })
    const { user } = await seed.createUser({ rol })
    const token = seed.signToken({ id: user.id, rol: rol._id.toString() })
    const res = await api
      .post('/api/period')
      .set('Authorization', `Bearer ${token}`)
      .send({ period: '2026' })
      .expect(401)
    expect(res.body.error).toBe('unauthorized rol')
  })

  test('200 crea periodo con rol no admin', async () => {
    const rol = await seed.createRol({ name: process.env.ROL_USER })
    const { user } = await seed.createUser({ rol })
    const gad = await seed.createGad()
    const token = seed.signToken({ id: user.id, rol: rol._id.toString() })
    const res = await api
      .post('/api/period')
      .set('Authorization', `Bearer ${token}`)
      .set('tenant', gad._id.toString())
      .send({ period: '2027' })
      .expect(200)
    expect(res.body.id).toBeDefined()
    expect(res.body.year).toBe('2027')
  })
})

describe('DELETE /api/period/:id (auth)', () => {
  test('400 sin token (jwt invalido)', async () => {
    const period = await seed.createPeriod()
    await api.delete(`/api/period/${period._id}`).expect(400)
  })

  test('200 elimina con rol no admin', async () => {
    const rol = await seed.createRol({ name: process.env.ROL_USER })
    const { user } = await seed.createUser({ rol })
    const period = await seed.createPeriod()
    const token = seed.signToken({ id: user.id, rol: rol._id.toString() })
    const res = await api
      .delete(`/api/period/${period._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
    expect(res.body.message).toBe('period delete!')
  })
})
