const supertest = require('supertest')
const app = require('../../app')
const db = require('../helpers/db')
const seed = require('../helpers/seed')
const Ods = require('../../models/ods')

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

describe('GET /api/ods', () => {
  test('devuelve ods con id y sin _id', async () => {
    await seed.createOds()
    const res = await api.get('/api/ods').expect(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].id).toBeDefined()
    expect(res.body[0]._id).toBeUndefined()
  })
})

describe('GET /api/ods/:id', () => {
  test('devuelve el ods', async () => {
    const ods = await seed.createOds()
    const res = await api.get(`/api/ods/${ods._id}`).expect(200)
    expect(res.body.id).toBe(ods._id.toString())
  })

  test('404 cuando no existe', async () => {
    await api.get('/api/ods/646172dcdc1f126cd5207c05').expect(404)
  })
})

describe('POST /api/ods', () => {
  test('crea un ods', async () => {
    const res = await api
      .post('/api/ods')
      .send({ name: 'ODS 2', number: 2, img: 'img.png' })
      .expect(200)
    expect(res.body.id).toBeDefined()
    expect(res.body.name).toBe('ODS 2')
  })
})

describe('PUT /api/ods/:id', () => {
  test('actualiza el ods', async () => {
    const ods = await seed.createOds()
    const res = await api
      .put(`/api/ods/${ods._id}`)
      .send({ name: 'Modificado', number: 9, img: 'x' })
      .expect(200)
    expect(res.body.name).toBe('Modificado')
  })
})

describe('DELETE /api/ods/:id', () => {
  test('elimina con 204', async () => {
    const ods = await seed.createOds()
    await api.delete(`/api/ods/${ods._id}`).expect(204)
    expect(await Ods.countDocuments({})).toBe(0)
  })
})
