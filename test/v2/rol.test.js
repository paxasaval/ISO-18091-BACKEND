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

describe('GET /api/v2/rol', () => {
  test('200 envelope { data } con campos v2', async () => {
    await seed.createRolV2({
      code: 'admin',
      slug: 'administrador',
      order: 1,
      permissions: ['user:read']
    })
    const res = await api.get('/api/v2/rol').expect(200)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.meta).toBeUndefined()
    expect(res.body.data[0].code).toBe('admin')
    expect(res.body.data[0].slug).toBe('administrador')
    expect(res.body.data[0].order).toBe(1)
    expect(res.body.data[0].permissions).toEqual(['user:read'])
  })
})

describe('GET /api/v2/rol/:id', () => {
  test('200 con envelope', async () => {
    const rol = await seed.createRolV2()
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
  test('201 crea con code/slug/order/permissions', async () => {
    const res = await api
      .post('/api/v2/rol')
      .send({
        name: 'Editor',
        description: 'rol editor',
        code: 'editor',
        slug: 'editor',
        order: 2,
        permissions: ['evidence:write']
      })
      .expect(201)
    expect(res.body.data.name).toBe('Editor')
    expect(res.body.data.code).toBe('editor')
    expect(res.body.data.order).toBe(2)
    expect(res.body.data.permissions).toEqual(['evidence:write'])
  })

  test('201 crea sin campos opcionales', async () => {
    const res = await api
      .post('/api/v2/rol')
      .send({ name: 'Basico', description: 'd' })
      .expect(201)
    expect(res.body.data.name).toBe('Basico')
  })

  test('400 VALIDATION_ERROR', async () => {
    const res = await api.post('/api/v2/rol').send({ name: 'x' }).expect(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('PUT /api/v2/rol/:id', () => {
  test('200 actualiza', async () => {
    const rol = await seed.createRolV2()
    const res = await api
      .put(`/api/v2/rol/${rol._id}`)
      .send({ name: 'Cambiado', description: 'd', order: 7 })
      .expect(200)
    expect(res.body.data.name).toBe('Cambiado')
    expect(res.body.data.order).toBe(7)
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
    const rol = await seed.createRolV2()
    await api.delete(`/api/v2/rol/${rol._id}`).expect(204)
  })

  test('404 NOT_FOUND', async () => {
    const res = await api
      .delete('/api/v2/rol/646172dcdc1f126cd5207c05')
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })
})
