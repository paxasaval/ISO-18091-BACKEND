const supertest = require('supertest')
const app = require('../../app')
const db = require('../helpers/db')
const seed = require('../helpers/seed-v2')

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

describe('GET /api/v2/valuation', () => {
  test('200 envelope { data }', async () => {
    await seed.createValuationV2()
    const res = await api.get('/api/v2/valuation').expect(200)
    expect(res.body.data).toHaveLength(1)
  })
})

describe('GET /api/v2/valuation/:id', () => {
  test('200 con envelope', async () => {
    const val = await seed.createValuationV2()
    const res = await api.get(`/api/v2/valuation/${val._id}`).expect(200)
    expect(res.body.data.id).toBe(val._id.toString())
  })

  test('404 NOT_FOUND', async () => {
    const res = await api
      .get('/api/v2/valuation/646172dcdc1f126cd5207c05')
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })
})

describe('POST /api/v2/valuation', () => {
  test('201 crea', async () => {
    const res = await api
      .post('/api/v2/valuation')
      .send({ name: 'V', category: 'c', maxValue: 10 })
      .expect(201)
    expect(res.body.data.maxValue).toBe(10)
  })

  test('400 VALIDATION_ERROR', async () => {
    const res = await api
      .post('/api/v2/valuation')
      .send({ name: 'V' })
      .expect(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('PUT /api/v2/valuation/:id', () => {
  test('200 actualiza', async () => {
    const val = await seed.createValuationV2()
    const res = await api
      .put(`/api/v2/valuation/${val._id}`)
      .send({ name: 'V2', category: 'c2', maxValue: 3 })
      .expect(200)
    expect(res.body.data.name).toBe('V2')
  })

  test('404 NOT_FOUND', async () => {
    const res = await api
      .put('/api/v2/valuation/646172dcdc1f126cd5207c05')
      .send({ name: 'V', category: 'c', maxValue: 1 })
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })
})

describe('DELETE /api/v2/valuation/:id', () => {
  test('204 elimina', async () => {
    const val = await seed.createValuationV2()
    await api.delete(`/api/v2/valuation/${val._id}`).expect(204)
  })

  test('404 NOT_FOUND', async () => {
    const res = await api
      .delete('/api/v2/valuation/646172dcdc1f126cd5207c05')
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })
})
