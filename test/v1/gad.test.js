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

describe('GET /api/gad', () => {
  test('devuelve gads con id y sin _id', async () => {
    await seed.createGad()
    const res = await api.get('/api/gad').expect(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].id).toBeDefined()
    expect(res.body[0]._id).toBeUndefined()
  })
})

describe('GET /api/gad/myWorkspace', () => {
  test('devuelve el gad del header tenant', async () => {
    const gad = await seed.createGad()
    const res = await api
      .get('/api/gad/myWorkspace')
      .set('tenant', gad._id.toString())
      .expect(200)
    expect(res.body.id).toBe(gad._id.toString())
    expect(res.body.name).toBe(gad.name)
  })
})

describe('POST /api/gad', () => {
  test('crea el gad', async () => {
    const res = await api
      .post('/api/gad')
      .send({ name: 'Nuevo GAD', code: 'C1', city: 'Quito', country: 'EC', size: 2 })
      .expect(200)
    expect(res.body.id).toBeDefined()
    expect(res.body.name).toBe('Nuevo GAD')
    expect(res.body.publishAuto).toBe(true)
  })
})

describe('PUT /api/gad/:id', () => {
  test('actualiza el gad', async () => {
    const gad = await seed.createGad()
    const res = await api
      .put(`/api/gad/${gad._id}`)
      .send({ name: 'Editado', code: 'C2', city: 'Cuenca', country: 'EC', size: 3 })
      .expect(200)
    expect(res.body.name).toBe('Editado')
  })
})

describe('PUT /api/gad/newReport (auth)', () => {
  // Comportamiento legacy: sin token, jwt.verify(undefined) lanza
  // JsonWebTokenError -> el errorHandler responde 400 'invalid token'
  // (la rama 401 'token missing' es inalcanzable). Contrato a preservar.
  test('400 sin token (jwt invalido)', async () => {
    const res = await api
      .put('/api/gad/newReport')
      .send({ source: 's', period: '2026', info: [] })
      .expect(400)
    expect(res.body.error).toBe('invalid token')
  })

  test('401 con rol no autorizado (ROL_USER)', async () => {
    const rol = await seed.createRol({ name: process.env.ROL_USER })
    const { user } = await seed.createUser({ rol })
    const token = seed.signToken({ id: user.id, rol: rol._id.toString() })
    const res = await api
      .put('/api/gad/newReport')
      .set('Authorization', `Bearer ${token}`)
      .send({ source: 's', period: '2026', info: [] })
      .expect(401)
    expect(res.body.error).toBe('unauthorized rol')
  })

  test('200 crea reporte con rol admin', async () => {
    const rol = await seed.createRol({ name: process.env.ROL_ADMIN })
    const { user } = await seed.createUser({ rol })
    const gad = await seed.createGad()
    const token = seed.signToken({ id: user.id, rol: rol._id.toString() })
    const res = await api
      .put('/api/gad/newReport')
      .set('Authorization', `Bearer ${token}`)
      .set('tenant', gad._id.toString())
      .send({ source: 'fuente', period: '2026', info: [{ label: 'l', data: 'd' }] })
      .expect(200)
    expect(res.body.id).toBeDefined()
    expect(res.body.report).toHaveLength(1)
  })
})
