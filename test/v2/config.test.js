const supertest = require('supertest')
const app = require('../../app')
const db = require('../helpers/db')

const api = supertest(app)

beforeAll(async () => {
  await db.connect()
})
afterAll(async () => {
  await db.disconnect()
})

describe('GET /api/v2/config/semaphore', () => {
  test('200 devuelve la escala 0-3 con value/key/label/color', async () => {
    const res = await api.get('/api/v2/config/semaphore').expect(200)
    const { scale, note } = res.body.data
    expect(Array.isArray(scale)).toBe(true)
    expect(scale).toHaveLength(4)
    expect(scale.map((s) => s.value)).toEqual([0, 1, 2, 3])
    scale.forEach((level) => {
      expect(typeof level.key).toBe('string')
      expect(typeof level.label).toBe('string')
      expect(typeof level.color).toBe('string')
    })
    expect(scale[0].key).toBe('no-evaluado')
    expect(scale[3].key).toBe('aceptable')
    expect(typeof note).toBe('string')
  })
})
