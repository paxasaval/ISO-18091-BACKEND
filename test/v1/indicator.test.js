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

describe('GET /api/indicators', () => {
  test('devuelve indicadores con ods poblados', async () => {
    const ods = await seed.createOds()
    await seed.createIndicator({ ods: [ods._id] })
    const res = await api.get('/api/indicators').expect(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].id).toBeDefined()
    expect(res.body[0].ods[0].name).toBeDefined()
  })

  test('filtra por quadrant via query', async () => {
    await seed.createIndicator({ quadrant: 1, number: 1 })
    await seed.createIndicator({ quadrant: 2, number: 1 })
    const res = await api.get('/api/indicators?quadrant=2').expect(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].quadrant).toBe(2)
  })
})

describe('GET /api/indicators/byQuadrantAndNumber', () => {
  test('devuelve el indicador exacto', async () => {
    await seed.createIndicator({ quadrant: 3, number: 5 })
    const res = await api
      .get('/api/indicators/byQuadrantAndNumber?quadrant=3&number=5')
      .expect(200)
    expect(res.body.quadrant).toBe(3)
    expect(res.body.number).toBe(5)
  })
})

describe('GET /api/indicators/:id', () => {
  test('devuelve el indicador', async () => {
    const indicator = await seed.createIndicator()
    const res = await api.get(`/api/indicators/${indicator._id}`).expect(200)
    expect(res.body.id).toBe(indicator._id.toString())
  })

  test('404 cuando no existe', async () => {
    await api.get('/api/indicators/646172dcdc1f126cd5207c05').expect(404)
  })
})

describe('POST /api/indicators', () => {
  test('crea el indicador', async () => {
    const ods = await seed.createOds()
    const res = await api
      .post('/api/indicators')
      .send({
        name: 'Ind Nuevo',
        description: 'd',
        number: 7,
        quadrant: 1,
        quadrantName: 'Q1',
        red: 'r',
        yellow: 'y',
        green: 'g',
        ods: [ods._id.toString()]
      })
      .expect(200)
    expect(res.body.id).toBeDefined()
    expect(res.body.name).toBe('Ind Nuevo')
  })
})

describe('DELETE /api/indicators/:id', () => {
  test('elimina con 204', async () => {
    const indicator = await seed.createIndicator()
    await api.delete(`/api/indicators/${indicator._id}`).expect(204)
  })
})
