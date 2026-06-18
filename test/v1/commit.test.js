const supertest = require('supertest')
const app = require('../../app')
const db = require('../helpers/db')
const seed = require('../helpers/seed')
const Commit = require('../../models/commit')

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

describe('GET /api/commits', () => {
  test('devuelve commits con id', async () => {
    await seed.createCommit()
    const res = await api.get('/api/commits').expect(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].id).toBeDefined()
    expect(res.body[0]._id).toBeUndefined()
  })
})

describe('GET /api/commits/:id', () => {
  test('devuelve el commit', async () => {
    const commit = await seed.createCommit()
    const res = await api.get(`/api/commits/${commit._id}`).expect(200)
    expect(res.body.id).toBe(commit._id.toString())
  })

  test('404 cuando no existe', async () => {
    await api.get('/api/commits/646172dcdc1f126cd5207c05').expect(404)
  })
})

describe('POST /api/commits', () => {
  test('crea un commit', async () => {
    const { user } = await seed.createUser()
    const res = await api
      .post('/api/commits')
      .send({ name: 'forza-creacion', body: 'comentario', autor: user.id })
      .expect(200)
    expect(res.body.id).toBeDefined()
    expect(res.body.body).toBe('comentario')
  })
})

describe('PUT /api/commits/:id', () => {
  test('actualiza el commit', async () => {
    const commit = await seed.createCommit()
    const res = await api
      .put(`/api/commits/${commit._id}`)
      .send({ body: 'editado' })
      .expect(200)
    expect(res.body.body).toBe('editado')
  })
})

describe('DELETE /api/commits/:id', () => {
  test('elimina con 204', async () => {
    const commit = await seed.createCommit()
    await api.delete(`/api/commits/${commit._id}`).expect(204)
    expect(await Commit.countDocuments({})).toBe(0)
  })
})
