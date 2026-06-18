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

describe('GET /api/v2/ods', () => {
  test('envelope de exito: { data } sin meta', async () => {
    await seed.createOdsV2()
    const res = await api.get('/api/v2/ods').expect(200)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].id).toBeDefined()
    expect(res.body.meta).toBeUndefined()
  })

  test('paginacion: meta.pagination con page/size/total/totalPages', async () => {
    for (let n = 1; n <= 5; n++) {
      await seed.createOdsV2({ number: n })
    }
    const res = await api.get('/api/v2/ods?page=1&size=2').expect(200)
    expect(res.body.data).toHaveLength(2)
    expect(res.body.meta.pagination).toEqual({
      page: 1,
      size: 2,
      total: 5,
      totalPages: 3
    })
  })

  test('400 VALIDATION_ERROR con size invalido', async () => {
    const res = await api.get('/api/v2/ods?size=0').expect(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('GET /api/v2/ods/:id', () => {
  test('200 con envelope', async () => {
    const ods = await seed.createOdsV2()
    const res = await api.get(`/api/v2/ods/${ods._id}`).expect(200)
    expect(res.body.data.id).toBe(ods._id.toString())
  })

  test('404 NOT_FOUND enveloped', async () => {
    const res = await api
      .get('/api/v2/ods/646172dcdc1f126cd5207c05')
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })

  test('400 INVALID_ID con id malformado', async () => {
    const res = await api.get('/api/v2/ods/not-an-id').expect(400)
    expect(res.body.error.code).toBe('INVALID_ID')
  })
})

describe('POST /api/v2/ods', () => {
  test('201 crea el ods', async () => {
    const res = await api
      .post('/api/v2/ods')
      .send({ number: 3, name: 'Salud', img: 'ods3.png' })
      .expect(201)
    expect(res.body.data.id).toBeDefined()
    expect(res.body.data.name).toBe('Salud')
  })

  test('400 VALIDATION_ERROR con body invalido', async () => {
    const res = await api.post('/api/v2/ods').send({ name: 'x' }).expect(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
    expect(Array.isArray(res.body.error.details)).toBe(true)
  })
})

describe('PUT /api/v2/ods/:id', () => {
  test('200 actualiza', async () => {
    const ods = await seed.createOdsV2()
    const res = await api
      .put(`/api/v2/ods/${ods._id}`)
      .send({ number: 9, name: 'Actualizado', img: 'ods9.png' })
      .expect(200)
    expect(res.body.data.name).toBe('Actualizado')
  })

  test('404 NOT_FOUND cuando no existe', async () => {
    const res = await api
      .put('/api/v2/ods/646172dcdc1f126cd5207c05')
      .send({ number: 1, name: 'x', img: 'i.png' })
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })
})

describe('DELETE /api/v2/ods/:id', () => {
  test('204 elimina', async () => {
    const ods = await seed.createOdsV2()
    await api.delete(`/api/v2/ods/${ods._id}`).expect(204)
  })

  test('404 NOT_FOUND cuando no existe', async () => {
    const res = await api
      .delete('/api/v2/ods/646172dcdc1f126cd5207c05')
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })
})
