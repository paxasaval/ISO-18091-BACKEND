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

describe('GET /api/v2/commit', () => {
  test('200 envelope { data }', async () => {
    await seed.createCommitV2()
    const res = await api.get('/api/v2/commit').expect(200)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data).toHaveLength(1)
  })

  test('paginacion: meta.pagination', async () => {
    for (let i = 0; i < 4; i++) await seed.createCommitV2()
    const res = await api.get('/api/v2/commit?page=1&size=2').expect(200)
    expect(res.body.data).toHaveLength(2)
    expect(res.body.meta.pagination.total).toBe(4)
  })
})

describe('GET /api/v2/commit/:id', () => {
  test('200 con envelope', async () => {
    const commit = await seed.createCommitV2()
    const res = await api.get(`/api/v2/commit/${commit._id}`).expect(200)
    expect(res.body.data.id).toBe(commit._id.toString())
  })

  test('404 NOT_FOUND', async () => {
    const res = await api
      .get('/api/v2/commit/646172dcdc1f126cd5207c05')
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })
})

describe('POST /api/v2/commit', () => {
  test('201 crea con author (nombre limpio)', async () => {
    const author = (await seed.createUserV2()).user
    const res = await api
      .post('/api/v2/commit')
      .send({ body: 'comentario', author: author._id.toString() })
      .expect(201)
    expect(res.body.data.id).toBeDefined()
    expect(res.body.data.body).toBe('comentario')
    expect(res.body.data.author).toBe(author._id.toString())
  })

  test('400 VALIDATION_ERROR con author no-objectId', async () => {
    const res = await api
      .post('/api/v2/commit')
      .send({ body: 'x', author: 'no-id' })
      .expect(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('PUT /api/v2/commit/:id', () => {
  test('200 actualiza', async () => {
    const commit = await seed.createCommitV2()
    const author = (await seed.createUserV2()).user
    const res = await api
      .put(`/api/v2/commit/${commit._id}`)
      .send({ body: 'editado', author: author._id.toString() })
      .expect(200)
    expect(res.body.data.body).toBe('editado')
  })

  test('404 NOT_FOUND', async () => {
    const author = (await seed.createUserV2()).user
    const res = await api
      .put('/api/v2/commit/646172dcdc1f126cd5207c05')
      .send({ body: 'x', author: author._id.toString() })
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })
})

describe('DELETE /api/v2/commit/:id', () => {
  test('204 elimina', async () => {
    const commit = await seed.createCommitV2()
    await api.delete(`/api/v2/commit/${commit._id}`).expect(204)
  })

  test('404 NOT_FOUND', async () => {
    const res = await api
      .delete('/api/v2/commit/646172dcdc1f126cd5207c05')
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })
})
