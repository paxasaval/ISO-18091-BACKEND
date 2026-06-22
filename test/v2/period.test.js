const supertest = require('supertest')
const app = require('../../app')
const db = require('../helpers/db')
const seed = require('../helpers/seed-v2')
const Period = require('../../src/v2/models/period.model')

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

const elevatedAuth = async () => {
  const rol = await seed.createRolV2({ name: 'Administrador' })
  const { user } = await seed.createUserV2({ rol })
  const token = seed.signToken({
    id: user._id.toString(),
    rol: rol._id.toString()
  })
  return { rol, user, token }
}

const baseUserAuth = async () => {
  const rol = await seed.createRolV2({ name: 'Ciudadano' })
  const { user } = await seed.createUserV2({ rol })
  const token = seed.signToken({
    id: user._id.toString(),
    rol: rol._id.toString()
  })
  return { rol, user, token }
}

const bearer = (token) => `Bearer ${token}`

describe('GET /api/v2/periods (PÚBLICO, sin token)', () => {
  test('200 lista por tenant SIN token (portal ciudadano)', async () => {
    const gad = await seed.createGadV2()
    await seed.createPeriodV2({ gad })
    const res = await api
      .get('/api/v2/periods')
      .set('tenant', gad._id.toString())
      .expect(200)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data).toHaveLength(1)
  })

  test('400 sin tenant', async () => {
    const res = await api.get('/api/v2/periods').expect(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('GET /api/v2/periods/:id (PÚBLICO, sin token)', () => {
  test('200 sin token', async () => {
    const period = await seed.createPeriodV2()
    const res = await api
      .get(`/api/v2/periods/${period._id}`)
      .expect(200)
    expect(res.body.data.id).toBe(period._id.toString())
  })

  test('404 NOT_FOUND', async () => {
    const res = await api
      .get('/api/v2/periods/646172dcdc1f126cd5207c05')
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })
})

describe('POST /api/v2/periods (rol elevado)', () => {
  test('401 sin token', async () => {
    const gad = await seed.createGadV2()
    const res = await api
      .post('/api/v2/periods')
      .set('tenant', gad._id.toString())
      .send({ year: '2027' })
      .expect(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  test('403 con rol base', async () => {
    const { token } = await baseUserAuth()
    const gad = await seed.createGadV2()
    const res = await api
      .post('/api/v2/periods')
      .set('Authorization', bearer(token))
      .set('tenant', gad._id.toString())
      .send({ year: '2027' })
      .expect(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })

  test('201 crea periodo', async () => {
    const { token } = await elevatedAuth()
    const gad = await seed.createGadV2()
    const res = await api
      .post('/api/v2/periods')
      .set('Authorization', bearer(token))
      .set('tenant', gad._id.toString())
      .send({ year: '2027' })
      .expect(201)
    expect(res.body.data.id).toBeDefined()
    expect(res.body.data.year).toBe('2027')
    expect(await Period.countDocuments()).toBe(1)
  })

  test('201 clone=true crea periodo y clona instancias', async () => {
    const { token } = await elevatedAuth()
    const gad = await seed.createGadV2()
    await seed.createIndicatorV2()
    await seed.createTypeV2({ mandatory: true })
    const res = await api
      .post('/api/v2/periods?clone=true')
      .set('Authorization', bearer(token))
      .set('tenant', gad._id.toString())
      .send({ year: '2028' })
      .expect(201)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data.length).toBeGreaterThan(0)
    expect(await Period.countDocuments()).toBe(1)
  })

  test('400 body invalido', async () => {
    const { token } = await elevatedAuth()
    const gad = await seed.createGadV2()
    const res = await api
      .post('/api/v2/periods')
      .set('Authorization', bearer(token))
      .set('tenant', gad._id.toString())
      .send({})
      .expect(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('DELETE /api/v2/periods/:id (rol elevado)', () => {
  test('204 elimina', async () => {
    const { token } = await elevatedAuth()
    const period = await seed.createPeriodV2()
    await api
      .delete(`/api/v2/periods/${period._id}`)
      .set('Authorization', bearer(token))
      .expect(204)
    expect(await Period.findById(period._id)).toBeNull()
  })

  test('403 con rol base', async () => {
    const { token } = await baseUserAuth()
    const period = await seed.createPeriodV2()
    const res = await api
      .delete(`/api/v2/periods/${period._id}`)
      .set('Authorization', bearer(token))
      .expect(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })
})
