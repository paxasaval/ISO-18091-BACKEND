// Tests de /api/v2/subindicators re-apuntado a la capa v2
// (SubindicatorV2 / v2_subindicators). Usa seed-v2.
const supertest = require('supertest')
const app = require('../../app')
const db = require('../helpers/db')
const seed = require('../helpers/seed-v2')
const Subindicator = require('../../src/v2/models/subindicator.model')
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

const citizenAuth = async () => {
  const rol = await seed.createRolV2({ name: 'Ciudadano' })
  const { user } = await seed.createUserV2({ rol })
  const token = seed.signToken({
    id: user._id.toString(),
    rol: rol._id.toString()
  })
  return { rol, user, token }
}

const bearer = (token) => `Bearer ${token}`

describe('GET /api/v2/subindicators', () => {
  test('200 envelope { data }', async () => {
    await seed.createSubindicatorV2()
    const res = await api.get('/api/v2/subindicators').expect(200)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].id).toBeDefined()
    // Nombres v2 limpios
    expect(res.body.data[0].typeId).toBeDefined()
    expect(res.body.data[0].indicatorInstanceId).toBeDefined()
  })

  test('filtra por ?indicator= (indicatorInstanceId v2)', async () => {
    const inst = await seed.createIndicatorInstanceV2()
    await seed.createSubindicatorV2({ indicatorInstance: inst })
    await seed.createSubindicatorV2() // otro instance diferente
    const res = await api
      .get(`/api/v2/subindicators?indicator=${inst._id}`)
      .expect(200)
    expect(res.body.data).toHaveLength(1)
  })

  test('paginacion: meta.pagination', async () => {
    const inst = await seed.createIndicatorInstanceV2()
    for (let i = 0; i < 3; i++) {
      await seed.createSubindicatorV2({ indicatorInstance: inst })
    }
    const res = await api
      .get(`/api/v2/subindicators?indicator=${inst._id}&page=1&size=2`)
      .expect(200)
    expect(res.body.data).toHaveLength(2)
    expect(res.body.meta.pagination.total).toBe(3)
  })

  test('?type=general devuelve aggregate (mandatory=true)', async () => {
    const inst = await seed.createIndicatorInstanceV2()
    const type = await seed.createTypeV2({ mandatory: true })
    await seed.createSubindicatorV2({ indicatorInstance: inst, type })
    const res = await api
      .get(`/api/v2/subindicators?indicator=${inst._id}&type=general`)
      .expect(200)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data).toHaveLength(1)
  })

  test('?type=specific devuelve aggregate (mandatory=false)', async () => {
    const inst = await seed.createIndicatorInstanceV2()
    const type = await seed.createTypeV2({ mandatory: false })
    await seed.createSubindicatorV2({ indicatorInstance: inst, type })
    const res = await api
      .get(`/api/v2/subindicators?indicator=${inst._id}&type=specific`)
      .expect(200)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data).toHaveLength(1)
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
    const sub = await seed.createSubindicatorV2()
    const res = await api.get(`/api/v2/subindicators/${sub._id}`).expect(200)
    expect(res.body.data.id).toBe(sub._id.toString())
    // Nombre limpio v2
    expect(res.body.data.responsibleText).toBeDefined()
    expect(res.body.data.responsibleUserIds).toBeDefined()
    expect(Array.isArray(res.body.data.responsibleUserIds)).toBe(true)
  })

  test('404 NOT_FOUND', async () => {
    const res = await api
      .get('/api/v2/subindicators/646172dcdc1f126cd5207c05')
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })

  test('400 INVALID_ID', async () => {
    const res = await api.get('/api/v2/subindicators/bad').expect(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('POST /api/v2/subindicators (subindicator:create)', () => {
  test('401 sin token', async () => {
    const inst = await seed.createIndicatorInstanceV2()
    const type = await seed.createTypeV2()
    const res = await api
      .post('/api/v2/subindicators')
      .send({
        indicatorInstanceId: inst._id.toString(),
        typeId: type._id.toString(),
        name: 'Sub'
      })
      .expect(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  test('403 Ciudadano sin subindicator:create', async () => {
    const { token } = await citizenAuth()
    const inst = await seed.createIndicatorInstanceV2()
    const type = await seed.createTypeV2()
    const res = await api
      .post('/api/v2/subindicators')
      .set('Authorization', bearer(token))
      .send({
        indicatorInstanceId: inst._id.toString(),
        typeId: type._id.toString(),
        name: 'Sub'
      })
      .expect(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })

  test('201 Responsable con subindicator:create puede crear', async () => {
    // Responsable tiene subindicator:create por diseno (ver permissions.ts)
    const { token } = await responsibleAuth()
    const inst = await seed.createIndicatorInstanceV2()
    const type = await seed.createTypeV2()
    const res = await api
      .post('/api/v2/subindicators')
      .set('Authorization', bearer(token))
      .send({
        indicatorInstanceId: inst._id.toString(),
        typeId: type._id.toString(),
        name: 'Sub Por Responsable'
      })
      .expect(201)
    expect(res.body.data.id).toBeDefined()
  })

  test('201 crea y enlaza a IndicatorInstanceV2 (Administrador)', async () => {
    const { token } = await elevatedAuth()
    const inst = await seed.createIndicatorInstanceV2()
    const type = await seed.createTypeV2()
    const res = await api
      .post('/api/v2/subindicators')
      .set('Authorization', bearer(token))
      .send({
        indicatorInstanceId: inst._id.toString(),
        typeId: type._id.toString(),
        name: 'Sub Nuevo'
      })
      .expect(201)
    expect(res.body.data.id).toBeDefined()
    expect(res.body.data.name).toBe('Sub Nuevo')
    // Verificar enlace en IndicatorInstanceV2
    const updatedInstance = await IndicatorInstance.findById(inst._id)
    expect(updatedInstance.subindicators.map((s) => s.toString())).toContain(
      res.body.data.id
    )
  })

  test('201 con responsibleUserIds', async () => {
    const { token } = await elevatedAuth()
    const inst = await seed.createIndicatorInstanceV2()
    const type = await seed.createTypeV2()
    const { user: responsible } = await seed.createUserV2()
    const res = await api
      .post('/api/v2/subindicators')
      .set('Authorization', bearer(token))
      .send({
        indicatorInstanceId: inst._id.toString(),
        typeId: type._id.toString(),
        name: 'Sub Con Responsable',
        responsibleUserIds: [responsible._id.toString()]
      })
      .expect(201)
    expect(res.body.data.id).toBeDefined()
  })

  test('400 body invalido (sin name)', async () => {
    const { token } = await elevatedAuth()
    const inst = await seed.createIndicatorInstanceV2()
    const type = await seed.createTypeV2()
    const res = await api
      .post('/api/v2/subindicators')
      .set('Authorization', bearer(token))
      .send({
        indicatorInstanceId: inst._id.toString(),
        typeId: type._id.toString()
      })
      .expect(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  test('400 body invalido (sin indicatorInstanceId)', async () => {
    const { token } = await elevatedAuth()
    const type = await seed.createTypeV2()
    const res = await api
      .post('/api/v2/subindicators')
      .set('Authorization', bearer(token))
      .send({ typeId: type._id.toString(), name: 'Sub' })
      .expect(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('PUT /api/v2/subindicators/:id (subindicator:create)', () => {
  test('200 actualiza nombre', async () => {
    const { token } = await elevatedAuth()
    const sub = await seed.createSubindicatorV2()
    const res = await api
      .put(`/api/v2/subindicators/${sub._id}`)
      .set('Authorization', bearer(token))
      .send({ name: 'Renombrado' })
      .expect(200)
    expect(res.body.data.name).toBe('Renombrado')
  })

  test('200 actualiza responsibleUserIds', async () => {
    const { token } = await elevatedAuth()
    const sub = await seed.createSubindicatorV2()
    const { user: responsible } = await seed.createUserV2()
    const res = await api
      .put(`/api/v2/subindicators/${sub._id}`)
      .set('Authorization', bearer(token))
      .send({ responsibleUserIds: [responsible._id.toString()] })
      .expect(200)
    expect(res.body.data.id).toBeDefined()
  })

  test('401 sin token', async () => {
    const sub = await seed.createSubindicatorV2()
    const res = await api
      .put(`/api/v2/subindicators/${sub._id}`)
      .send({ name: 'x' })
      .expect(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  test('404 NOT_FOUND', async () => {
    const { token } = await elevatedAuth()
    const res = await api
      .put('/api/v2/subindicators/646172dcdc1f126cd5207c05')
      .set('Authorization', bearer(token))
      .send({ name: 'x' })
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })

  test('400 body vacio', async () => {
    const { token } = await elevatedAuth()
    const sub = await seed.createSubindicatorV2()
    const res = await api
      .put(`/api/v2/subindicators/${sub._id}`)
      .set('Authorization', bearer(token))
      .send({})
      .expect(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('DELETE /api/v2/subindicators/:id (subindicator:create)', () => {
  test('204 elimina', async () => {
    const { token } = await elevatedAuth()
    const sub = await seed.createSubindicatorV2()
    await api
      .delete(`/api/v2/subindicators/${sub._id}`)
      .set('Authorization', bearer(token))
      .expect(204)
    expect(await Subindicator.findById(sub._id)).toBeNull()
  })

  // B5: al borrar un subindicador, se desenlaza del IndicatorInstance padre.
  test('B5: al eliminar, se hace $pull del IndicatorInstance padre', async () => {
    const { token } = await elevatedAuth()
    const inst = await seed.createIndicatorInstanceV2()
    const sub = await seed.createSubindicatorV2({ indicatorInstance: inst })

    // Enlazar manualmente el sub a la instancia.
    await IndicatorInstance.findByIdAndUpdate(inst._id, {
      subindicators: [sub._id]
    })

    // Verificar que esta enlazado.
    const instBefore = await IndicatorInstance.findById(inst._id)
    expect(instBefore.subindicators.map((s) => s.toString())).toContain(sub._id.toString())

    await api
      .delete(`/api/v2/subindicators/${sub._id}`)
      .set('Authorization', bearer(token))
      .expect(204)

    // Verificar que fue desenlazado.
    const instAfter = await IndicatorInstance.findById(inst._id)
    expect(instAfter.subindicators.map((s) => s.toString())).not.toContain(sub._id.toString())
  })

  test('401 sin token', async () => {
    const sub = await seed.createSubindicatorV2()
    const res = await api
      .delete(`/api/v2/subindicators/${sub._id}`)
      .expect(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  test('403 Ciudadano', async () => {
    const { token } = await citizenAuth()
    const sub = await seed.createSubindicatorV2()
    const res = await api
      .delete(`/api/v2/subindicators/${sub._id}`)
      .set('Authorization', bearer(token))
      .expect(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })

  test('404 NOT_FOUND', async () => {
    const { token } = await elevatedAuth()
    const res = await api
      .delete('/api/v2/subindicators/646172dcdc1f126cd5207c05')
      .set('Authorization', bearer(token))
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })
})
