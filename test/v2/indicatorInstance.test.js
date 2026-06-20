// Tests de /api/v2/indicator-instances re-apuntado a la capa v2
// (IndicatorInstanceV2 / v2_indicator_instances). Usa seed-v2.
const supertest = require('supertest')
const app = require('../../app')
const db = require('../helpers/db')
const seed = require('../helpers/seed-v2')
const IndicatorInstance = require('../../src/v2/models/indicator-instance.model')

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

const responsibleAuth = async () => {
  const rol = await seed.createRolV2({ name: 'Responsable' })
  const { user } = await seed.createUserV2({ rol })
  const token = seed.signToken({
    id: user._id.toString(),
    rol: rol._id.toString()
  })
  return { rol, user, token }
}

const bearer = (token) => `Bearer ${token}`

describe('GET /api/v2/indicator-instances', () => {
  test('200 listado completo sin tenant', async () => {
    await seed.createIndicatorInstanceV2()
    const res = await api.get('/api/v2/indicator-instances').expect(200)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data).toHaveLength(1)
    // Nombres v2 limpios
    expect(res.body.data[0].id).toBeDefined()
  })

  test('200 filtra por period+quadrant v2', async () => {
    const gad = await seed.createGadV2()
    const period = await seed.createPeriodV2({ gad })
    const indQ1 = await seed.createIndicatorV2({ quadrant: 1, number: 1 })
    const indQ2 = await seed.createIndicatorV2({ quadrant: 2, number: 1 })
    await seed.createIndicatorInstanceV2({
      gad,
      period,
      indicator: indQ1,
      year: '2026'
    })
    await seed.createIndicatorInstanceV2({
      gad,
      period,
      indicator: indQ2,
      year: '2026'
    })
    const res = await api
      .get('/api/v2/indicator-instances?period=2026&quadrant=2')
      .set('tenant', gad._id.toString())
      .expect(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].indicatorInstanceId.quadrant).toBe(2)
  })

  test('400 filtro con tenant sin period', async () => {
    const gad = await seed.createGadV2()
    const res = await api
      .get('/api/v2/indicator-instances?quadrant=1')
      .set('tenant', gad._id.toString())
      .expect(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('GET /api/v2/indicator-instances/summary', () => {
  test('200 resumen por cuadrante v2', async () => {
    const gad = await seed.createGadV2()
    const period = await seed.createPeriodV2({ gad })
    const ind = await seed.createIndicatorV2({
      quadrant: 1,
      number: 1,
      quadrantName: 'Q1'
    })
    await seed.createIndicatorInstanceV2({
      gad,
      period,
      indicator: ind,
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
    const gad = await seed.createGadV2()
    const res = await api
      .get('/api/v2/indicator-instances/summary')
      .set('tenant', gad._id.toString())
      .expect(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  test('400 summary sin tenant', async () => {
    const res = await api
      .get('/api/v2/indicator-instances/summary?period=2026')
      .expect(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('GET /api/v2/indicator-instances/:id', () => {
  test('200', async () => {
    const instance = await seed.createIndicatorInstanceV2()
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
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('PUT /api/v2/indicator-instances/:id (indicator:create)', () => {
  test('401 sin token', async () => {
    const instance = await seed.createIndicatorInstanceV2()
    const res = await api
      .put(`/api/v2/indicator-instances/${instance._id}`)
      .send({ qualification: 2, subindicators: [] })
      .expect(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  test('403 con rol Responsable (sin indicator:create)', async () => {
    const { token } = await responsibleAuth()
    const instance = await seed.createIndicatorInstanceV2()
    const res = await api
      .put(`/api/v2/indicator-instances/${instance._id}`)
      .set('Authorization', bearer(token))
      .send({ qualification: 2, subindicators: [] })
      .expect(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })

  test('200 actualiza (Administrador)', async () => {
    const { token } = await elevatedAuth()
    const instance = await seed.createIndicatorInstanceV2()
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

describe('DELETE /api/v2/indicator-instances/:id (indicator:create)', () => {
  test('204 elimina (Administrador)', async () => {
    const { token } = await elevatedAuth()
    const instance = await seed.createIndicatorInstanceV2()
    await api
      .delete(`/api/v2/indicator-instances/${instance._id}`)
      .set('Authorization', bearer(token))
      .expect(204)
    expect(await IndicatorInstance.findById(instance._id)).toBeNull()
  })

  test('403 con rol Responsable', async () => {
    const { token } = await responsibleAuth()
    const instance = await seed.createIndicatorInstanceV2()
    const res = await api
      .delete(`/api/v2/indicator-instances/${instance._id}`)
      .set('Authorization', bearer(token))
      .expect(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })

  test('401 sin token', async () => {
    const instance = await seed.createIndicatorInstanceV2()
    const res = await api
      .delete(`/api/v2/indicator-instances/${instance._id}`)
      .expect(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })
})
