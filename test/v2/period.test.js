const supertest = require('supertest')
const app = require('../../app')
const db = require('../helpers/db')
const seed = require('../helpers/seed')
const Period = require('../../models/period')

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
  const rol = await seed.createRol({ name: 'Administrador' })
  const { user } = await seed.createUser({ rol })
  const token = seed.signToken({
    id: user._id.toString(),
    rol: rol._id.toString()
  })
  return { rol, user, token }
}

const baseUserAuth = async () => {
  const rol = await seed.createRol({ name: 'Ciudadano' })
  const { user } = await seed.createUser({ rol })
  const token = seed.signToken({
    id: user._id.toString(),
    rol: rol._id.toString()
  })
  return { rol, user, token }
}

const bearer = (token) => `Bearer ${token}`

describe('GET /api/v2/periods (auth)', () => {
  test('401 sin token', async () => {
    const gad = await seed.createGad()
    const res = await api
      .get('/api/v2/periods')
      .set('tenant', gad._id.toString())
      .expect(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  test('200 lista por tenant', async () => {
    const { token } = await elevatedAuth()
    const gad = await seed.createGad()
    await seed.createPeriod({ gad })
    const res = await api
      .get('/api/v2/periods')
      .set('Authorization', bearer(token))
      .set('tenant', gad._id.toString())
      .expect(200)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data).toHaveLength(1)
  })

  test('400 sin tenant', async () => {
    const { token } = await elevatedAuth()
    const res = await api
      .get('/api/v2/periods')
      .set('Authorization', bearer(token))
      .expect(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('GET /api/v2/periods/:id (auth)', () => {
  test('200', async () => {
    const { token } = await elevatedAuth()
    const period = await seed.createPeriod()
    const res = await api
      .get(`/api/v2/periods/${period._id}`)
      .set('Authorization', bearer(token))
      .expect(200)
    expect(res.body.data.id).toBe(period._id.toString())
  })

  test('404 NOT_FOUND', async () => {
    const { token } = await elevatedAuth()
    const res = await api
      .get('/api/v2/periods/646172dcdc1f126cd5207c05')
      .set('Authorization', bearer(token))
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })
})

describe('POST /api/v2/periods (rol elevado)', () => {
  test('401 sin token', async () => {
    const gad = await seed.createGad()
    const res = await api
      .post('/api/v2/periods')
      .set('tenant', gad._id.toString())
      .send({ year: '2027' })
      .expect(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  test('403 con rol base', async () => {
    const { token } = await baseUserAuth()
    const gad = await seed.createGad()
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
    const gad = await seed.createGad()
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
    const gad = await seed.createGad()
    await seed.createIndicator()
    await seed.createType({ mandatory: true })
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
    const gad = await seed.createGad()
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
    const period = await seed.createPeriod()
    await api
      .delete(`/api/v2/periods/${period._id}`)
      .set('Authorization', bearer(token))
      .expect(204)
    expect(await Period.findById(period._id)).toBeNull()
  })

  test('403 con rol base', async () => {
    const { token } = await baseUserAuth()
    const period = await seed.createPeriod()
    const res = await api
      .delete(`/api/v2/periods/${period._id}`)
      .set('Authorization', bearer(token))
      .expect(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })
})
