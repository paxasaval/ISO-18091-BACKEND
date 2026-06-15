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

describe('GET /api/v2/indicators', () => {
  test('envelope de exito: { data } con ods poblados', async () => {
    const ods = await seed.createOds()
    await seed.createIndicator({ ods: [ods._id] })
    const res = await api.get('/api/v2/indicators').expect(200)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].id).toBeDefined()
    expect(res.body.data[0].ods[0].name).toBeDefined()
    expect(res.body.meta).toBeUndefined()
  })

  test('filtra por quadrant', async () => {
    await seed.createIndicator({ quadrant: 1, number: 1 })
    await seed.createIndicator({ quadrant: 2, number: 1 })
    const res = await api.get('/api/v2/indicators?quadrant=2').expect(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].quadrant).toBe(2)
  })

  test('paginacion: meta.pagination con page/size/total/totalPages', async () => {
    for (let n = 1; n <= 5; n++) {
      await seed.createIndicator({ quadrant: 1, number: n })
    }
    const res = await api
      .get('/api/v2/indicators?page=1&size=2')
      .expect(200)
    expect(res.body.data).toHaveLength(2)
    expect(res.body.meta.pagination).toEqual({
      page: 1,
      size: 2,
      total: 5,
      totalPages: 3
    })
  })

  test('400 VALIDATION_ERROR con size invalido', async () => {
    const res = await api.get('/api/v2/indicators?size=0').expect(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
    expect(res.body.error.details).toBeDefined()
  })
})

describe('GET /api/v2/indicators/:id', () => {
  test('200 con envelope', async () => {
    const indicator = await seed.createIndicator()
    const res = await api
      .get(`/api/v2/indicators/${indicator._id}`)
      .expect(200)
    expect(res.body.data.id).toBe(indicator._id.toString())
  })

  test('404 NOT_FOUND enveloped', async () => {
    const res = await api
      .get('/api/v2/indicators/646172dcdc1f126cd5207c05')
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
    expect(res.body.error.message).toBeDefined()
  })

  test('400 INVALID_ID con id malformado', async () => {
    const res = await api.get('/api/v2/indicators/not-an-id').expect(400)
    expect(res.body.error.code).toBe('INVALID_ID')
  })
})

describe('POST /api/v2/indicators', () => {
  test('201 crea el indicador', async () => {
    const ods = await seed.createOds()
    const res = await api
      .post('/api/v2/indicators')
      .send({
        name: 'Ind Nuevo',
        description: 'd',
        number: 7,
        quadrant: 1,
        quadrantName: 'Q1',
        red: 'r',
        yellow: 'y',
        green: 'g',
        ods: [ods._id.toString()]
      })
      .expect(201)
    expect(res.body.data.id).toBeDefined()
    expect(res.body.data.name).toBe('Ind Nuevo')
  })

  test('400 VALIDATION_ERROR con body invalido', async () => {
    const res = await api
      .post('/api/v2/indicators')
      .send({ name: 'sin lo demas' })
      .expect(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
    expect(Array.isArray(res.body.error.details)).toBe(true)
  })
})

describe('PUT /api/v2/indicators/:id', () => {
  test('200 actualiza', async () => {
    const ods = await seed.createOds()
    const indicator = await seed.createIndicator({ ods: [ods._id] })
    const res = await api
      .put(`/api/v2/indicators/${indicator._id}`)
      .send({
        name: 'Actualizado',
        description: 'd2',
        number: 9,
        quadrant: 2,
        quadrantName: 'Q2',
        red: 'r',
        yellow: 'y',
        green: 'g',
        ods: [ods._id.toString()]
      })
      .expect(200)
    expect(res.body.data.name).toBe('Actualizado')
    expect(res.body.data.quadrant).toBe(2)
  })

  test('404 NOT_FOUND cuando no existe', async () => {
    const res = await api
      .put('/api/v2/indicators/646172dcdc1f126cd5207c05')
      .send({
        name: 'x',
        description: 'd',
        number: 1,
        quadrant: 1,
        quadrantName: 'Q1',
        red: 'r',
        yellow: 'y',
        green: 'g'
      })
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })
})

describe('DELETE /api/v2/indicators/:id', () => {
  test('204 elimina', async () => {
    const indicator = await seed.createIndicator()
    await api.delete(`/api/v2/indicators/${indicator._id}`).expect(204)
  })

  test('404 NOT_FOUND cuando no existe', async () => {
    const res = await api
      .delete('/api/v2/indicators/646172dcdc1f126cd5207c05')
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })
})
