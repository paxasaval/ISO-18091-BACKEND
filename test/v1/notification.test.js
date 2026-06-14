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

describe('GET /api/notifications/allMyNotify', () => {
  test('devuelve las notificaciones del usuario', async () => {
    const { user } = await seed.createUser()
    await seed.createNotify({ sendTo: user._id })
    const res = await api
      .get('/api/notifications/allMyNotify')
      .query({ userID: user._id.toString() })
      .expect(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].id).toBeDefined()
    expect(res.body[0]._id).toBeUndefined()
  })
})

describe('GET /api/notifications/numOfUnreadNotify', () => {
  test('devuelve el conteo de no leidas (state=1)', async () => {
    const { user } = await seed.createUser()
    await seed.createNotify({ sendTo: user._id, state: 1 })
    await seed.createNotify({ sendTo: user._id, state: 2 })
    const res = await api
      .get('/api/notifications/numOfUnreadNotify')
      .query({ userID: user._id.toString() })
      .expect(200)
    expect(res.body).toBe(1)
  })
})

describe('GET /api/notifications/unreadNotify', () => {
  test('devuelve solo las no leidas', async () => {
    const { user } = await seed.createUser()
    await seed.createNotify({ sendTo: user._id, state: 1 })
    await seed.createNotify({ sendTo: user._id, state: 2 })
    const res = await api
      .get('/api/notifications/unreadNotify')
      .query({ userID: user._id.toString() })
      .expect(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].state).toBe(1)
  })
})

describe('GET /api/notifications/:id', () => {
  test('devuelve la notificacion', async () => {
    const notify = await seed.createNotify()
    const res = await api.get(`/api/notifications/${notify._id}`).expect(200)
    expect(res.body.id).toBe(notify._id.toString())
  })

  test('404 cuando no existe', async () => {
    await api
      .get('/api/notifications/646172dcdc1f126cd5207c05')
      .expect(404)
  })
})

describe('PUT /api/notifications/checkNotify', () => {
  test('marca como leida (state=2)', async () => {
    const notify = await seed.createNotify({ state: 1 })
    const res = await api
      .put('/api/notifications/checkNotify')
      .send({ id: notify._id.toString() })
      .expect(200)
    expect(res.body.state).toBe(2)
  })
})

describe('PUT /api/notifications/uncheckNotify', () => {
  test('marca como no leida (state=1)', async () => {
    const notify = await seed.createNotify({ state: 2 })
    const res = await api
      .put('/api/notifications/uncheckNotify')
      .send({ id: notify._id.toString() })
      .expect(200)
    expect(res.body.state).toBe(1)
  })
})

describe('DELETE /api/notifications/:id', () => {
  test('elimina con 204', async () => {
    const notify = await seed.createNotify()
    await api.delete(`/api/notifications/${notify._id}`).expect(204)
  })
})
