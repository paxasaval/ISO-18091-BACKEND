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

describe('GET /api/v2/notifications', () => {
  test('200 envelope { data } con enums etiquetados', async () => {
    await seed.createNotificationV2()
    const res = await api.get('/api/v2/notifications').expect(200)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].entityType).toBe('indicator')
    expect(res.body.data[0].action).toBe('added')
  })

  test('filtra por state', async () => {
    await seed.createNotificationV2({ state: 1 })
    await seed.createNotificationV2({ state: 0 })
    const res = await api.get('/api/v2/notifications?state=0').expect(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].state).toBe(0)
  })
})

describe('GET /api/v2/notifications/:id', () => {
  test('200 con envelope', async () => {
    const notif = await seed.createNotificationV2()
    const res = await api.get(`/api/v2/notifications/${notif._id}`).expect(200)
    expect(res.body.data.id).toBe(notif._id.toString())
  })

  test('404 NOT_FOUND', async () => {
    const res = await api
      .get('/api/v2/notifications/646172dcdc1f126cd5207c05')
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })
})

describe('POST /api/v2/notifications', () => {
  test('201 acepta numericos y deriva enums etiquetados', async () => {
    const res = await api
      .post('/api/v2/notifications')
      .send({ type: 2, content: 'cambio', itemType: 3, state: 1 })
      .expect(201)
    expect(res.body.data.type).toBe(2)
    expect(res.body.data.itemType).toBe(3)
    expect(res.body.data.action).toBe('modified')
    expect(res.body.data.entityType).toBe('evidence')
  })

  test('201 acepta etiquetas y deriva los numericos', async () => {
    const res = await api
      .post('/api/v2/notifications')
      .send({
        action: 'deleted',
        entityType: 'subindicator',
        content: 'eliminado',
        state: 1
      })
      .expect(201)
    expect(res.body.data.action).toBe('deleted')
    expect(res.body.data.entityType).toBe('subindicator')
    expect(res.body.data.type).toBe(3)
    expect(res.body.data.itemType).toBe(2)
  })

  test('400 VALIDATION_ERROR con entityType invalido', async () => {
    const res = await api
      .post('/api/v2/notifications')
      .send({ entityType: 'otro', content: 'x', state: 1 })
      .expect(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('PUT /api/v2/notifications/:id', () => {
  test('200 actualiza', async () => {
    const notif = await seed.createNotificationV2()
    const res = await api
      .put(`/api/v2/notifications/${notif._id}`)
      .send({ action: 'modified', entityType: 'indicator', content: 'c', state: 0 })
      .expect(200)
    expect(res.body.data.action).toBe('modified')
    expect(res.body.data.state).toBe(0)
  })

  test('404 NOT_FOUND', async () => {
    const res = await api
      .put('/api/v2/notifications/646172dcdc1f126cd5207c05')
      .send({ type: 1, content: 'c', itemType: 1, state: 1 })
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })
})

describe('DELETE /api/v2/notifications/:id', () => {
  test('204 elimina', async () => {
    const notif = await seed.createNotificationV2()
    await api.delete(`/api/v2/notifications/${notif._id}`).expect(204)
  })

  test('404 NOT_FOUND', async () => {
    const res = await api
      .delete('/api/v2/notifications/646172dcdc1f126cd5207c05')
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })
})
