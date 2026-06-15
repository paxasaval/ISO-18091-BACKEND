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

describe('GET /api/v2/news', () => {
  test('200 envelope { data }', async () => {
    await seed.createNews()
    const res = await api.get('/api/v2/news').expect(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.meta).toBeUndefined()
  })

  test('filtra por gad', async () => {
    const gad = await seed.createGad()
    await seed.createNews({ gad })
    await seed.createNews()
    const res = await api.get(`/api/v2/news?gad=${gad._id}`).expect(200)
    expect(res.body.data).toHaveLength(1)
  })
})

describe('GET /api/v2/news/:id', () => {
  test('200 con envelope', async () => {
    const news = await seed.createNews()
    const res = await api.get(`/api/v2/news/${news._id}`).expect(200)
    expect(res.body.data.id).toBe(news._id.toString())
  })

  test('404 NOT_FOUND', async () => {
    const res = await api
      .get('/api/v2/news/646172dcdc1f126cd5207c05')
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })
})

describe('POST /api/v2/news', () => {
  test('201 crea', async () => {
    const author = (await seed.createUser()).user
    const gad = await seed.createGad()
    const res = await api
      .post('/api/v2/news')
      .send({
        image: 'i.png',
        title: 'T',
        description: 'd',
        tag: ['a'],
        author: author._id.toString(),
        gad: gad._id.toString()
      })
      .expect(201)
    expect(res.body.data.title).toBe('T')
  })

  test('400 VALIDATION_ERROR con author no-objectId', async () => {
    const res = await api
      .post('/api/v2/news')
      .send({
        image: 'i.png',
        title: 'T',
        description: 'd',
        author: 'no-id',
        gad: '646172dcdc1f126cd5207c05'
      })
      .expect(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('PUT /api/v2/news/:id', () => {
  test('200 actualiza', async () => {
    const news = await seed.createNews()
    const author = (await seed.createUser()).user
    const gad = await seed.createGad()
    const res = await api
      .put(`/api/v2/news/${news._id}`)
      .send({
        image: 'i2.png',
        title: 'T2',
        description: 'd2',
        author: author._id.toString(),
        gad: gad._id.toString()
      })
      .expect(200)
    expect(res.body.data.title).toBe('T2')
  })

  test('404 NOT_FOUND', async () => {
    const author = (await seed.createUser()).user
    const gad = await seed.createGad()
    const res = await api
      .put('/api/v2/news/646172dcdc1f126cd5207c05')
      .send({
        image: 'i.png',
        title: 'T',
        description: 'd',
        author: author._id.toString(),
        gad: gad._id.toString()
      })
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })
})

describe('DELETE /api/v2/news/:id', () => {
  test('204 elimina', async () => {
    const news = await seed.createNews()
    await api.delete(`/api/v2/news/${news._id}`).expect(204)
  })

  test('404 NOT_FOUND', async () => {
    const res = await api
      .delete('/api/v2/news/646172dcdc1f126cd5207c05')
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })
})
