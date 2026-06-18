const supertest = require('supertest')
const app = require('../../app')
const db = require('../helpers/db')
const seed = require('../helpers/seed-v2')
const Characteristic = require('../../src/v2/models/characteristic.model')

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

describe('GET /api/v2/characteristics', () => {
  test('200 envelope { data }', async () => {
    await seed.createCharacteristicV2()
    const res = await api.get('/api/v2/characteristics').expect(200)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].id).toBeDefined()
  })

  test('paginacion: meta.pagination', async () => {
    for (let i = 0; i < 3; i++) await seed.createCharacteristicV2()
    const res = await api
      .get('/api/v2/characteristics?page=1&size=2')
      .expect(200)
    expect(res.body.data).toHaveLength(2)
    expect(res.body.meta.pagination.total).toBe(3)
  })

  test('400 VALIDATION_ERROR con size invalido', async () => {
    const res = await api.get('/api/v2/characteristics?size=0').expect(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('GET /api/v2/characteristics/:id', () => {
  test('200 con valuations pobladas', async () => {
    const ch = await seed.createCharacteristicV2()
    const res = await api.get(`/api/v2/characteristics/${ch._id}`).expect(200)
    expect(res.body.data.id).toBe(ch._id.toString())
    expect(Array.isArray(res.body.data.valuations)).toBe(true)
    expect(res.body.data.valuations[0].name).toBeDefined()
  })

  test('404 NOT_FOUND', async () => {
    const res = await api
      .get('/api/v2/characteristics/646172dcdc1f126cd5207c05')
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })

  test('400 INVALID_ID', async () => {
    const res = await api.get('/api/v2/characteristics/bad').expect(400)
    expect(res.body.error.code).toBe('INVALID_ID')
  })
})

describe('POST /api/v2/characteristics (rol elevado)', () => {
  test('401 UNAUTHORIZED sin token', async () => {
    const res = await api
      .post('/api/v2/characteristics')
      .send({ name: 'x' })
      .expect(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  test('201 crea', async () => {
    const { token } = await elevatedAuth()
    const valuation = await seed.createValuationV2()
    const res = await api
      .post('/api/v2/characteristics')
      .set('Authorization', bearer(token))
      .send({
        name: 'Caract Nueva',
        group: 'g',
        groupName: 'G1',
        tier: 1,
        valuations: [valuation._id.toString()],
        allowedFormats: ['pdf'],
        inputKind: 'file',
        isCover: true,
        slug: 'caract-nueva',
        order: 2
      })
      .expect(201)
    expect(res.body.data.id).toBeDefined()
    expect(res.body.data.name).toBe('Caract Nueva')
    expect(res.body.data.inputKind).toBe('file')
    expect(res.body.data.allowedFormats).toEqual(['pdf'])
    expect(res.body.data.isCover).toBe(true)
    expect(res.body.data.slug).toBe('caract-nueva')
    expect(res.body.data.order).toBe(2)
  })

  test('400 VALIDATION_ERROR', async () => {
    const { token } = await elevatedAuth()
    const res = await api
      .post('/api/v2/characteristics')
      .set('Authorization', bearer(token))
      .send({ name: 'x' })
      .expect(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('PUT /api/v2/characteristics/:id (rol elevado)', () => {
  test('200 reemplaza', async () => {
    const { token } = await elevatedAuth()
    const ch = await seed.createCharacteristicV2()
    const res = await api
      .put(`/api/v2/characteristics/${ch._id}`)
      .set('Authorization', bearer(token))
      .send({
        name: 'Editada',
        group: 'g',
        groupName: 'G',
        required: false,
        tier: 2,
        isRequired: false,
        unique: true
      })
      .expect(200)
    expect(res.body.data.name).toBe('Editada')
    expect(res.body.data.tier).toBe(2)
  })

  test('404 NOT_FOUND', async () => {
    const { token } = await elevatedAuth()
    const res = await api
      .put('/api/v2/characteristics/646172dcdc1f126cd5207c05')
      .set('Authorization', bearer(token))
      .send({
        name: 'x',
        group: 'g',
        groupName: 'G',
        required: true,
        tier: 1,
        isRequired: true,
        unique: false
      })
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })
})

describe('PATCH /api/v2/characteristics/:id/format (rol elevado)', () => {
  test('200 actualiza format', async () => {
    const { token } = await elevatedAuth()
    const ch = await seed.createCharacteristicV2()
    const res = await api
      .patch(`/api/v2/characteristics/${ch._id}/format`)
      .set('Authorization', bearer(token))
      .send({ format: 'tabla' })
      .expect(200)
    expect(res.body.data.format).toBe('tabla')
  })

  test('404 NOT_FOUND', async () => {
    const { token } = await elevatedAuth()
    const res = await api
      .patch('/api/v2/characteristics/646172dcdc1f126cd5207c05/format')
      .set('Authorization', bearer(token))
      .send({ format: 'x' })
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })
})

describe('PATCH /api/v2/characteristics/:id/inputKind (rol elevado)', () => {
  test('200 actualiza inputKind', async () => {
    const { token } = await elevatedAuth()
    const ch = await seed.createCharacteristicV2()
    const res = await api
      .patch(`/api/v2/characteristics/${ch._id}/inputKind`)
      .set('Authorization', bearer(token))
      .send({ inputKind: 'link' })
      .expect(200)
    expect(res.body.data.inputKind).toBe('link')
  })

  test('400 VALIDATION_ERROR con inputKind invalido', async () => {
    const { token } = await elevatedAuth()
    const ch = await seed.createCharacteristicV2()
    const res = await api
      .patch(`/api/v2/characteristics/${ch._id}/inputKind`)
      .set('Authorization', bearer(token))
      .send({ inputKind: 'otro' })
      .expect(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('PATCH /api/v2/characteristics/:id/valuation (rol elevado)', () => {
  test('200 actualiza valuations', async () => {
    const { token } = await elevatedAuth()
    const ch = await seed.createCharacteristicV2()
    const valuation = await seed.createValuationV2()
    const res = await api
      .patch(`/api/v2/characteristics/${ch._id}/valuation`)
      .set('Authorization', bearer(token))
      .send({ valuations: [valuation._id.toString()] })
      .expect(200)
    expect(res.body.data.valuations).toHaveLength(1)
  })
})

describe('DELETE /api/v2/characteristics/:id (rol elevado)', () => {
  test('204 elimina', async () => {
    const { token } = await elevatedAuth()
    const ch = await seed.createCharacteristicV2()
    await api
      .delete(`/api/v2/characteristics/${ch._id}`)
      .set('Authorization', bearer(token))
      .expect(204)
    expect(await Characteristic.findById(ch._id)).toBeNull()
  })

  test('404 NOT_FOUND', async () => {
    const { token } = await elevatedAuth()
    const res = await api
      .delete('/api/v2/characteristics/646172dcdc1f126cd5207c05')
      .set('Authorization', bearer(token))
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })
})
