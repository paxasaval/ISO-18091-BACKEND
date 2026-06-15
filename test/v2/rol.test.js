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

describe('GET /api/v2/rol', () => {
  test('200 envelope { data }', async () => {
    await seed.createRol()
    const res = await api.get('/api/v2/rol').expect(200)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.meta).toBeUndefined()
  })
})

describe('GET /api/v2/rol/:id', () => {
  test('200 con envelope', async () => {
    const rol = await seed.createRol()
    const res = await api.get(`/api/v2/rol/${rol._id}`).expect(200)
    expect(res.body.data.id).toBe(rol._id.toString())
  })

  test('404 NOT_FOUND', async () => {
    const res = await api
      .get('/api/v2/rol/646172dcdc1f126cd5207c05')
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })
})

describe('POST /api/v2/rol', () => {
  test('201 crea', async () => {
    const res = await api
      .post('/api/v2/rol')
      .send({ name: 'Editor', description: 'rol editor' })
      .expect(201)
    expect(res.body.data.name).toBe('Editor')
  })

  test('400 VALIDATION_ERROR', async () => {
    const res = await api.post('/api/v2/rol').send({ name: 'x' }).expect(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('PUT /api/v2/rol/:id', () => {
  test('200 actualiza', async () => {
    const rol = await seed.createRol()
    const res = await api
      .put(`/api/v2/rol/${rol._id}`)
      .send({ name: 'Cambiado', description: 'd' })
      .expect(200)
    expect(res.body.data.name).toBe('Cambiado')
  })

  test('404 NOT_FOUND', async () => {
    const res = await api
      .put('/api/v2/rol/646172dcdc1f126cd5207c05')
      .send({ name: 'x', description: 'd' })
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })
})

describe('DELETE /api/v2/rol/:id', () => {
  test('204 elimina', async () => {
    const rol = await seed.createRol()
    await api.delete(`/api/v2/rol/${rol._id}`).expect(204)
  })

  test('404 NOT_FOUND', async () => {
    const res = await api
      .delete('/api/v2/rol/646172dcdc1f126cd5207c05')
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })
})
