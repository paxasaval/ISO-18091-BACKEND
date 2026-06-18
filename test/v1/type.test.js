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

describe('GET /api/type', () => {
  test('devuelve tipos con characteristics pobladas', async () => {
    const characteristic = await seed.createCharacteristic()
    await seed.createType({ characteristics: [characteristic._id] })
    const res = await api.get('/api/type').expect(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].id).toBeDefined()
    expect(res.body[0].characteristics).toHaveLength(1)
    expect(res.body[0].characteristics[0].name).toBeDefined()
  })

  test('filtra por mandatory via query', async () => {
    await seed.createType({ mandatory: true })
    await seed.createType({ mandatory: false })
    const res = await api.get('/api/type?mandatory=false').expect(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].mandatory).toBe(false)
  })
})

describe('GET /api/type/:id', () => {
  test('devuelve el tipo', async () => {
    const type = await seed.createType()
    const res = await api.get(`/api/type/${type._id}`).expect(200)
    expect(res.body.id).toBe(type._id.toString())
  })

  test('404 cuando no existe', async () => {
    await api.get('/api/type/646172dcdc1f126cd5207c05').expect(404)
  })
})

describe('POST /api/type', () => {
  test('crea el tipo', async () => {
    const characteristic = await seed.createCharacteristic()
    const res = await api
      .post('/api/type')
      .send({
        name: 'Nuevo Tipo',
        green: 'g',
        yellow: 'y',
        red: 'r',
        mandatory: true,
        characteristics: [characteristic._id.toString()]
      })
      .expect(200)
    expect(res.body.id).toBeDefined()
    expect(res.body.name).toBe('Nuevo Tipo')
  })
})

describe('POST /api/type/addExtraInfo', () => {
  test('agrega extraInfo al tipo', async () => {
    const type = await seed.createType()
    const res = await api
      .post(`/api/type/addExtraInfo?id=${type._id}`)
      .send({ extras: { a: 1 } })
      .expect(200)
    expect(res.body.extraInfo).toEqual({ a: 1 })
  })
})

describe('DELETE /api/type/:id', () => {
  test('elimina con 204', async () => {
    const type = await seed.createType()
    await api.delete(`/api/type/${type._id}`).expect(204)
  })
})
