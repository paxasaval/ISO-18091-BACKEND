const supertest = require('supertest')
const app = require('../../app')
const db = require('../helpers/db')
const seed = require('../helpers/seed')
const SubIndicator = require('../../models/subindicator')
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

describe('GET /api/v2/subindicators', () => {
  test('200 envelope { data }', async () => {
    await seed.createSubIndicator()
    const res = await api.get('/api/v2/subindicators').expect(200)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].id).toBeDefined()
  })

  test('filtra por ?indicator=', async () => {
    const sub = await seed.createSubIndicator()
    await seed.createSubIndicator()
    const res = await api
      .get(`/api/v2/subindicators?indicator=${sub.indicadorID}`)
      .expect(200)
    expect(res.body.data).toHaveLength(1)
  })

  test('paginacion: meta.pagination', async () => {
    const instance = await seed.createIndicatorInstance()
    for (let i = 0; i < 3; i++) {
      await seed.createSubIndicator({ indicadorID: instance })
    }
    const res = await api
      .get(`/api/v2/subindicators?indicator=${instance._id}&page=1&size=2`)
      .expect(200)
    expect(res.body.data).toHaveLength(2)
    expect(res.body.meta.pagination.total).toBe(3)
  })

  test('?type=general devuelve aggregate', async () => {
    const sub = await seed.createSubIndicator()
    const res = await api
      .get(`/api/v2/subindicators?indicator=${sub.indicadorID}&type=general`)
      .expect(200)
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  test('400 ?type sin indicator', async () => {
    const res = await api
      .get('/api/v2/subindicators?type=general')
      .expect(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('GET /api/v2/subindicators/:id', () => {
  test('200', async () => {
    const sub = await seed.createSubIndicator()
    const res = await api.get(`/api/v2/subindicators/${sub._id}`).expect(200)
    expect(res.body.data.id).toBe(sub._id.toString())
  })

  test('404 NOT_FOUND', async () => {
    const res = await api
      .get('/api/v2/subindicators/646172dcdc1f126cd5207c05')
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })

  test('400 INVALID_ID', async () => {
    const res = await api.get('/api/v2/subindicators/bad').expect(400)
    expect(res.body.error.code).toBe('INVALID_ID')
  })
})

describe('POST /api/v2/subindicators (rol elevado)', () => {
  test('401 sin token', async () => {
    const instance = await seed.createIndicatorInstance()
    const type = await seed.createType()
    const res = await api
      .post('/api/v2/subindicators')
      .send({
        indicadorID: instance._id.toString(),
        typeID: type._id.toString(),
        name: 'Sub'
      })
      .expect(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  test('403 con rol base', async () => {
    const { token } = await baseUserAuth()
    const instance = await seed.createIndicatorInstance()
    const type = await seed.createType()
    const res = await api
      .post('/api/v2/subindicators')
      .set('Authorization', bearer(token))
      .send({
        indicadorID: instance._id.toString(),
        typeID: type._id.toString(),
        name: 'Sub'
      })
      .expect(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })

  test('201 crea y enlaza a la instancia', async () => {
    const { token } = await elevatedAuth()
    const instance = await seed.createIndicatorInstance()
    const type = await seed.createType()
    const res = await api
      .post('/api/v2/subindicators')
      .set('Authorization', bearer(token))
      .set('tenant', instance.gadID.toString())
      .send({
        indicadorID: instance._id.toString(),
        typeID: type._id.toString(),
        name: 'Sub Nuevo'
      })
      .expect(201)
    expect(res.body.data.id).toBeDefined()
    const updatedInstance = await IndicatorInstance.findById(instance._id)
    expect(updatedInstance.subindicators.map((s) => s.toString())).toContain(
      res.body.data.id
    )
  })

  test('400 body invalido', async () => {
    const { token } = await elevatedAuth()
    const res = await api
      .post('/api/v2/subindicators')
      .set('Authorization', bearer(token))
      .send({ name: 'x' })
      .expect(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('PUT/DELETE /api/v2/subindicators/:id', () => {
  test('200 actualiza', async () => {
    const sub = await seed.createSubIndicator()
    const res = await api
      .put(`/api/v2/subindicators/${sub._id}`)
      .send({ name: 'Renombrado' })
      .expect(200)
    expect(res.body.data.name).toBe('Renombrado')
  })

  test('404 PUT NOT_FOUND', async () => {
    const res = await api
      .put('/api/v2/subindicators/646172dcdc1f126cd5207c05')
      .send({ name: 'x' })
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })

  test('204 elimina', async () => {
    const sub = await seed.createSubIndicator()
    await api.delete(`/api/v2/subindicators/${sub._id}`).expect(204)
    expect(await SubIndicator.findById(sub._id)).toBeNull()
  })

  test('404 DELETE NOT_FOUND', async () => {
    const res = await api
      .delete('/api/v2/subindicators/646172dcdc1f126cd5207c05')
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })
})
