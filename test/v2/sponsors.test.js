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

describe('GET /api/v2/sponsors', () => {
  test('200 envelope { data }', async () => {
    await seed.createSponsor()
    const res = await api.get('/api/v2/sponsors').expect(200)
    expect(res.body.data).toHaveLength(1)
  })

  test('paginacion: meta.pagination', async () => {
    for (let n = 0; n < 4; n++) {
      await seed.createSponsor()
    }
    const res = await api.get('/api/v2/sponsors?page=1&size=2').expect(200)
    expect(res.body.data).toHaveLength(2)
    expect(res.body.meta.pagination).toEqual({
      page: 1,
      size: 2,
      total: 4,
      totalPages: 2
    })
  })
})

describe('GET /api/v2/sponsors/:id', () => {
  test('200 con envelope', async () => {
    const sponsor = await seed.createSponsor()
    const res = await api.get(`/api/v2/sponsors/${sponsor._id}`).expect(200)
    expect(res.body.data.id).toBe(sponsor._id.toString())
  })

  test('404 NOT_FOUND', async () => {
    const res = await api
      .get('/api/v2/sponsors/646172dcdc1f126cd5207c05')
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })
})

describe('POST /api/v2/sponsors', () => {
  test('201 crea', async () => {
    const gad = await seed.createGad()
    const res = await api
      .post('/api/v2/sponsors')
      .send({
        name: 'Sp',
        description: 'd',
        gad: gad._id.toString(),
        image: 'i.png',
        state: true
      })
      .expect(201)
    expect(res.body.data.name).toBe('Sp')
  })

  test('400 VALIDATION_ERROR sin campos requeridos', async () => {
    const res = await api
      .post('/api/v2/sponsors')
      .send({ name: 'Sp' })
      .expect(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('PUT /api/v2/sponsors/:id', () => {
  test('200 actualiza', async () => {
    const sponsor = await seed.createSponsor()
    const gad = await seed.createGad()
    const res = await api
      .put(`/api/v2/sponsors/${sponsor._id}`)
      .send({
        name: 'Sp2',
        description: 'd2',
        gad: gad._id.toString(),
        image: 'i2.png',
        state: false
      })
      .expect(200)
    expect(res.body.data.name).toBe('Sp2')
  })

  test('404 NOT_FOUND', async () => {
    const gad = await seed.createGad()
    const res = await api
      .put('/api/v2/sponsors/646172dcdc1f126cd5207c05')
      .send({
        name: 'Sp',
        description: 'd',
        gad: gad._id.toString(),
        image: 'i.png',
        state: true
      })
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })
})

describe('DELETE /api/v2/sponsors/:id', () => {
  test('204 elimina', async () => {
    const sponsor = await seed.createSponsor()
    await api.delete(`/api/v2/sponsors/${sponsor._id}`).expect(204)
  })

  test('404 NOT_FOUND', async () => {
    const res = await api
      .delete('/api/v2/sponsors/646172dcdc1f126cd5207c05')
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })
})
