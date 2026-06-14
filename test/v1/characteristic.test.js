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

describe('GET /api/characteristics/:id', () => {
  test('devuelve la caracteristica con id', async () => {
    const characteristic = await seed.createCharacteristic()
    const res = await api
      .get(`/api/characteristics/${characteristic._id}`)
      .expect(200)
    expect(res.body.id).toBe(characteristic._id.toString())
    expect(res.body._id).toBeUndefined()
  })

  test('404 cuando no existe', async () => {
    await api
      .get('/api/characteristics/646172dcdc1f126cd5207c05')
      .expect(404)
  })
})

describe('GET /api/characteristics/valuation', () => {
  test('devuelve la caracteristica con valuation poblada', async () => {
    const valuation = await seed.createValuation()
    const characteristic = await seed.createCharacteristic({
      valuation: [valuation._id]
    })
    const res = await api
      .get(`/api/characteristics/valuation?id=${characteristic._id}`)
      .expect(200)
    expect(res.body.id).toBe(characteristic._id.toString())
    expect(res.body.valuation[0].name).toBeDefined()
  })
})

describe('POST /api/characteristics', () => {
  test('crea la caracteristica', async () => {
    const valuation = await seed.createValuation()
    const res = await api
      .post('/api/characteristics')
      .send({
        name: 'Nueva',
        group: 'g',
        groupName: 'G',
        score: 3,
        tier: 1,
        valuation: [valuation._id.toString()],
        allowed_formats: ['pdf']
      })
      .expect(200)
    expect(res.body.id).toBeDefined()
    expect(res.body.name).toBe('Nueva')
  })
})

describe('POST /api/characteristics/changeType', () => {
  test('cambia el type', async () => {
    const characteristic = await seed.createCharacteristic()
    const res = await api
      .post(`/api/characteristics/changeType?id=${characteristic._id}`)
      .send({ type: 5 })
      .expect(200)
    expect(res.body.type).toBe(5)
  })
})

describe('PUT /api/characteristics/:id', () => {
  test('actualiza la caracteristica', async () => {
    const characteristic = await seed.createCharacteristic()
    const res = await api
      .put(`/api/characteristics/${characteristic._id}`)
      .send({
        name: 'Editada',
        group: 'g',
        groupName: 'G',
        required: true,
        score: 4,
        tier: 2,
        isRequired: true,
        unique: false
      })
      .expect(200)
    expect(res.body.name).toBe('Editada')
  })
})

describe('DELETE /api/characteristics/:id', () => {
  test('elimina con 204', async () => {
    const characteristic = await seed.createCharacteristic()
    await api
      .delete(`/api/characteristics/${characteristic._id}`)
      .expect(204)
  })
})
