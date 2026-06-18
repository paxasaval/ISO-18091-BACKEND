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

describe('GET /api/valuation', () => {
  test('devuelve valuations con id', async () => {
    await seed.createValuation()
    const res = await api.get('/api/valuation').expect(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].id).toBeDefined()
    expect(res.body[0]._id).toBeUndefined()
  })
})

describe('POST /api/valuation', () => {
  test('crea una valuation', async () => {
    const res = await api
      .post('/api/valuation')
      .send({ name: 'V1', category: 'c', maxValue: 10 })
      .expect(200)
    expect(res.body.id).toBeDefined()
    expect(res.body.maxValue).toBe(10)
  })
})
