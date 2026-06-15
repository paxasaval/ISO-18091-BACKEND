const supertest = require('supertest')
const app = require('../../app')
const db = require('../helpers/db')
const seed = require('../helpers/seed')
const IndicatorInstance = require('../../models/indicatorInstance')

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

const responsibleAuth = async () => {
  const rol = await seed.createRol({ name: 'Responsable' })
  const { user } = await seed.createUser({ rol })
  const token = seed.signToken({
    id: user._id.toString(),
    rol: rol._id.toString()
  })
  return { rol, user, token }
}

const bearer = (token) => `Bearer ${token}`

describe('GET /api/v2/indicator-instances', () => {
  test('200 listado completo sin tenant', async () => {
    await seed.createIndicatorInstance()
    const res = await api.get('/api/v2/indicator-instances').expect(200)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data).toHaveLength(1)
  })

  test('200 filtra por period+quadrant', async () => {
    const gad = await seed.createGad()
    const period = await seed.createPeriod({ gad })
    const indQ1 = await seed.createIndicator({ quadrant: 1, number: 1 })
    const indQ2 = await seed.createIndicator({ quadrant: 2, number: 1 })
    await seed.createIndicatorInstance({
      gadID: gad,
      period,
      indicatorID: indQ1,
      year: '2026'
    })
    await seed.createIndicatorInstance({
      gadID: gad,
      period,
      indicatorID: indQ2,
      year: '2026'
    })
    const res = await api
      .get('/api/v2/indicator-instances?period=2026&quadrant=2')
      .set('tenant', gad._id.toString())
      .expect(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].indicatorID.quadrant).toBe(2)
  })

  test('400 filtro con tenant sin period', async () => {
    const gad = await seed.createGad()
    const res = await api
      .get('/api/v2/indicator-instances?quadrant=1')
      .set('tenant', gad._id.toString())
      .expect(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('GET /api/v2/indicator-instances/summary', () => {
  test('200 resumen por cuadrante', async () => {
    const gad = await seed.createGad()
    const period = await seed.createPeriod({ gad })
    const ind = await seed.createIndicator({
      quadrant: 1,
      number: 1,
      quadrantName: 'Q1'
    })
    await seed.createIndicatorInstance({
      gadID: gad,
      period,
      indicatorID: ind,
      year: '2026',
      qualification: 3
    })
    const res = await api
      .get(`/api/v2/indicator-instances/summary?period=${period._id}`)
      .set('tenant', gad._id.toString())
      .expect(200)
    expect(res.body.data).toHaveLength(4)
    expect(res.body.data[0].quadrantName).toBe('Q1')
    expect(res.body.data[0].qualify_3).toBe(1)
  })

  test('400 summary sin period', async () => {
    const gad = await seed.createGad()
    const res = await api
      .get('/api/v2/indicator-instances/summary')
      .set('tenant', gad._id.toString())
      .expect(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('GET /api/v2/indicator-instances/:id', () => {
  test('200', async () => {
    const instance = await seed.createIndicatorInstance()
    const res = await api
      .get(`/api/v2/indicator-instances/${instance._id}`)
      .expect(200)
    expect(res.body.data.id).toBe(instance._id.toString())
  })

  test('404 NOT_FOUND', async () => {
    const res = await api
      .get('/api/v2/indicator-instances/646172dcdc1f126cd5207c05')
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })

  test('400 INVALID_ID', async () => {
    const res = await api.get('/api/v2/indicator-instances/bad').expect(400)
    expect(res.body.error.code).toBe('INVALID_ID')
  })
})

describe('PUT /api/v2/indicator-instances/:id (ADMIN)', () => {
  test('401 sin token', async () => {
    const instance = await seed.createIndicatorInstance()
    const res = await api
      .put(`/api/v2/indicator-instances/${instance._id}`)
      .send({ qualification: 2, subindicators: [] })
      .expect(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  test('403 con rol Responsable (no ADMIN)', async () => {
    const { token } = await responsibleAuth()
    const instance = await seed.createIndicatorInstance()
    const res = await api
      .put(`/api/v2/indicator-instances/${instance._id}`)
      .set('Authorization', bearer(token))
      .send({ qualification: 2, subindicators: [] })
      .expect(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })

  test('200 actualiza (ADMIN)', async () => {
    const { token } = await elevatedAuth()
    const instance = await seed.createIndicatorInstance()
    const res = await api
      .put(`/api/v2/indicator-instances/${instance._id}`)
      .set('Authorization', bearer(token))
      .send({ qualification: 3, subindicators: [] })
      .expect(200)
    expect(res.body.data.qualification).toBe(3)
  })

  test('404 NOT_FOUND', async () => {
    const { token } = await elevatedAuth()
    const res = await api
      .put('/api/v2/indicator-instances/646172dcdc1f126cd5207c05')
      .set('Authorization', bearer(token))
      .send({ qualification: 1, subindicators: [] })
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })
})

describe('DELETE /api/v2/indicator-instances/:id (ADMIN)', () => {
  test('204 elimina (ADMIN)', async () => {
    const { token } = await elevatedAuth()
    const instance = await seed.createIndicatorInstance()
    await api
      .delete(`/api/v2/indicator-instances/${instance._id}`)
      .set('Authorization', bearer(token))
      .expect(204)
    expect(await IndicatorInstance.findById(instance._id)).toBeNull()
  })

  test('403 con rol Responsable', async () => {
    const { token } = await responsibleAuth()
    const instance = await seed.createIndicatorInstance()
    const res = await api
      .delete(`/api/v2/indicator-instances/${instance._id}`)
      .set('Authorization', bearer(token))
      .expect(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })
})
