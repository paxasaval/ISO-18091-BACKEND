const supertest = require('supertest')
const app = require('../../app')
const db = require('../helpers/db')
const seed = require('../helpers/seed-v2')
const Gad = require('../../src/v2/models/gad.model')

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

// Crea un rol elevado (Administrador) y un token firmado con ese rol.
const elevatedAuth = async () => {
  const rol = await seed.createRolV2({ name: 'Administrador' })
  const { user } = await seed.createUserV2({ rol })
  const token = seed.signToken({ id: user._id.toString(), rol: rol._id.toString() })
  return { rol, user, token }
}

const bearer = (token) => `Bearer ${token}`

describe('GET /api/v2/gad', () => {
  test('200 envelope { data }', async () => {
    await seed.createGadV2()
    const res = await api.get('/api/v2/gad').expect(200)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].id).toBeDefined()
  })

  test('paginacion: meta.pagination', async () => {
    for (let i = 0; i < 3; i++) await seed.createGadV2()
    const res = await api.get('/api/v2/gad?page=1&size=2').expect(200)
    expect(res.body.data).toHaveLength(2)
    expect(res.body.meta.pagination.total).toBe(3)
    expect(res.body.meta.pagination.totalPages).toBe(2)
  })

  test('400 VALIDATION_ERROR con size invalido', async () => {
    const res = await api.get('/api/v2/gad?size=0').expect(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('GET /api/v2/gad/:id', () => {
  test('200 con envelope', async () => {
    const gad = await seed.createGadV2()
    const res = await api.get(`/api/v2/gad/${gad._id}`).expect(200)
    expect(res.body.data.id).toBe(gad._id.toString())
  })

  test('404 NOT_FOUND', async () => {
    const res = await api
      .get('/api/v2/gad/646172dcdc1f126cd5207c05')
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })

  test('400 INVALID_ID con id malformado', async () => {
    const res = await api.get('/api/v2/gad/not-an-id').expect(400)
    expect(res.body.error.code).toBe('INVALID_ID')
  })
})

describe('POST /api/v2/gad (rol elevado)', () => {
  test('401 UNAUTHORIZED sin token', async () => {
    const res = await api
      .post('/api/v2/gad')
      .send({ name: 'X', code: 'C', city: 'C', country: 'C', size: 1 })
      .expect(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  test('201 crea el gad', async () => {
    const { token } = await elevatedAuth()
    const res = await api
      .post('/api/v2/gad')
      .set('Authorization', bearer(token))
      .send({
        name: 'GAD Nuevo',
        code: 'G-99',
        city: 'Loja',
        country: 'Ecuador',
        size: 5
      })
      .expect(201)
    expect(res.body.data.id).toBeDefined()
    expect(res.body.data.name).toBe('GAD Nuevo')
    expect(res.body.data.publishAuto).toBe(true)
  })

  test('400 VALIDATION_ERROR con body invalido', async () => {
    const { token } = await elevatedAuth()
    const res = await api
      .post('/api/v2/gad')
      .set('Authorization', bearer(token))
      .send({ name: 'incompleto' })
      .expect(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
    expect(Array.isArray(res.body.error.details)).toBe(true)
  })
})

describe('PUT /api/v2/gad/:id (rol elevado)', () => {
  test('200 actualiza', async () => {
    const { token } = await elevatedAuth()
    const gad = await seed.createGadV2()
    const res = await api
      .put(`/api/v2/gad/${gad._id}`)
      .set('Authorization', bearer(token))
      .send({
        name: 'Renombrado',
        code: 'G-1',
        city: 'Quito',
        country: 'Ecuador',
        size: 9
      })
      .expect(200)
    expect(res.body.data.name).toBe('Renombrado')
    expect(res.body.data.city).toBe('Quito')
  })

  test('404 NOT_FOUND', async () => {
    const { token } = await elevatedAuth()
    const res = await api
      .put('/api/v2/gad/646172dcdc1f126cd5207c05')
      .set('Authorization', bearer(token))
      .send({
        name: 'x',
        code: 'c',
        city: 'c',
        country: 'c',
        size: 1
      })
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })
})

describe('DELETE /api/v2/gad/:id (rol elevado)', () => {
  test('204 elimina', async () => {
    const { token } = await elevatedAuth()
    const gad = await seed.createGadV2()
    await api
      .delete(`/api/v2/gad/${gad._id}`)
      .set('Authorization', bearer(token))
      .expect(204)
    expect(await Gad.findById(gad._id)).toBeNull()
  })

  test('404 NOT_FOUND', async () => {
    const { token } = await elevatedAuth()
    const res = await api
      .delete('/api/v2/gad/646172dcdc1f126cd5207c05')
      .set('Authorization', bearer(token))
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })
})

describe('GET/POST /api/v2/gad/:id/reports', () => {
  test('200 lista vacia inicialmente', async () => {
    const gad = await seed.createGadV2()
    const res = await api.get(`/api/v2/gad/${gad._id}/reports`).expect(200)
    expect(res.body.data).toEqual([])
  })

  test('201 crea y enlaza un report', async () => {
    const { token } = await elevatedAuth()
    const gad = await seed.createGadV2()
    const res = await api
      .post(`/api/v2/gad/${gad._id}/reports`)
      .set('Authorization', bearer(token))
      .send({
        source: 'fuente',
        period: '2026',
        info: [{ label: 'l', data: 'd' }]
      })
      .expect(201)
    // El modelo Report v2 define toJSON con id (_id -> id).
    expect(res.body.data.id).toBeDefined()
    const stored = await Gad.findById(gad._id)
    expect(stored.report).toHaveLength(1)
  })
})

describe('PUT /api/v2/gad/:id/config (rol elevado)', () => {
  test('200 actualiza publishAuto + reportDefault', async () => {
    const { token } = await elevatedAuth()
    const gad = await seed.createGadV2()
    const reportId = '646172dcdc1f126cd5207c05'
    const res = await api
      .put(`/api/v2/gad/${gad._id}/config`)
      .set('Authorization', bearer(token))
      .send({ reportDefault: reportId, publishAuto: false })
      .expect(200)
    expect(res.body.data.publishAuto).toBe(false)
    expect(res.body.data.reportDefault).toBe(reportId)
  })
})
