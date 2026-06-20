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

// Crea un rol con catalog:manage (Administrador) y token firmado.
const catalogAuth = async () => {
  const rol = await seed.createRolV2({ name: 'Administrador' })
  const { user } = await seed.createUserV2({ rol })
  const token = seed.signToken({ id: user._id.toString(), rol: rol._id.toString() })
  return { rol, user, token }
}

const bearer = (token) => `Bearer ${token}`

describe('GET /api/v2/types', () => {
  test('200 envelope { data } con characteristics pobladas', async () => {
    const ch = await seed.createCharacteristicV2()
    await seed.createTypeV2({ characteristics: [ch._id] })
    const res = await api.get('/api/v2/types').expect(200)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.meta).toBeUndefined()
    // characteristics poblada -> objeto con nombre limpio, no solo id.
    expect(res.body.data[0].characteristics[0].name).toBe('Caracteristica Test')
    expect(res.body.data[0].slug).toBe('tipo-test')
    expect(res.body.data[0].order).toBe(1)
  })

  test('alias /api/v2/type devuelve lo mismo', async () => {
    await seed.createTypeV2()
    const res = await api.get('/api/v2/type').expect(200)
    expect(res.body.data).toHaveLength(1)
  })

  test('?mandatory=true filtra solo los obligatorios', async () => {
    await seed.createTypeV2({ name: 'Obligatorio', mandatory: true })
    await seed.createTypeV2({ name: 'Opcional', mandatory: false })
    const res = await api.get('/api/v2/types?mandatory=true').expect(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].name).toBe('Obligatorio')
    expect(res.body.data[0].mandatory).toBe(true)
  })

  test('?mandatory=false filtra solo los no obligatorios', async () => {
    await seed.createTypeV2({ name: 'Obligatorio', mandatory: true })
    await seed.createTypeV2({ name: 'Opcional', mandatory: false })
    const res = await api.get('/api/v2/types?mandatory=false').expect(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].name).toBe('Opcional')
  })

  test('ordena por order asc (luego name)', async () => {
    await seed.createTypeV2({ name: 'C', order: 3 })
    await seed.createTypeV2({ name: 'A', order: 1 })
    await seed.createTypeV2({ name: 'B', order: 2 })
    const res = await api.get('/api/v2/types').expect(200)
    expect(res.body.data.map((t) => t.order)).toEqual([1, 2, 3])
    expect(res.body.data.map((t) => t.name)).toEqual(['A', 'B', 'C'])
  })

  test('paginacion: meta.pagination', async () => {
    for (let i = 0; i < 4; i++) {
      await seed.createTypeV2({ name: `T${i}`, order: i })
    }
    const res = await api.get('/api/v2/types?page=1&size=2').expect(200)
    expect(res.body.data).toHaveLength(2)
    expect(res.body.meta.pagination.total).toBe(4)
    expect(res.body.meta.pagination.totalPages).toBe(2)
  })
})

describe('GET /api/v2/types/:id', () => {
  test('200 con characteristics pobladas', async () => {
    const type = await seed.createTypeV2()
    const res = await api.get(`/api/v2/types/${type._id}`).expect(200)
    expect(res.body.data.id).toBe(type._id.toString())
    expect(res.body.data.characteristics[0].name).toBe('Caracteristica Test')
  })

  test('404 NOT_FOUND', async () => {
    const res = await api
      .get('/api/v2/types/646172dcdc1f126cd5207c05')
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })
})

describe('POST /api/v2/types (requirePermission catalog:manage)', () => {
  test('401 UNAUTHORIZED sin token', async () => {
    const res = await api
      .post('/api/v2/types')
      .send({ name: 'X', red: 'r', yellow: 'y', green: 'g', mandatory: true })
      .expect(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  test('403 FORBIDDEN con rol sin catalog:manage', async () => {
    const rol = await seed.createRolV2({ name: 'Ciudadano' })
    const { user } = await seed.createUserV2({ rol })
    const token = seed.signToken({ id: user._id.toString(), rol: rol._id.toString() })
    const res = await api
      .post('/api/v2/types')
      .set('Authorization', bearer(token))
      .send({ name: 'Nuevo Tipo', red: 'r', yellow: 'y', green: 'g', mandatory: true })
      .expect(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })

  test('201 crea con slug/order', async () => {
    const { token } = await catalogAuth()
    const res = await api
      .post('/api/v2/types')
      .set('Authorization', bearer(token))
      .send({
        name: 'Nuevo Tipo',
        red: 'r',
        yellow: 'y',
        green: 'g',
        mandatory: true,
        slug: 'nuevo-tipo',
        order: 5
      })
      .expect(201)
    expect(res.body.data.name).toBe('Nuevo Tipo')
    expect(res.body.data.slug).toBe('nuevo-tipo')
    expect(res.body.data.order).toBe(5)
  })

  test('400 VALIDATION_ERROR', async () => {
    const { token } = await catalogAuth()
    const res = await api
      .post('/api/v2/types')
      .set('Authorization', bearer(token))
      .send({ name: 'x' })
      .expect(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('PUT /api/v2/types/:id (requirePermission catalog:manage)', () => {
  test('200 actualiza', async () => {
    const { token } = await catalogAuth()
    const type = await seed.createTypeV2()
    const res = await api
      .put(`/api/v2/types/${type._id}`)
      .set('Authorization', bearer(token))
      .send({
        name: 'Cambiado',
        red: 'r',
        yellow: 'y',
        green: 'g',
        mandatory: false,
        slug: 'cambiado',
        order: 9
      })
      .expect(200)
    expect(res.body.data.name).toBe('Cambiado')
    expect(res.body.data.order).toBe(9)
  })

  test('404 NOT_FOUND', async () => {
    const { token } = await catalogAuth()
    const res = await api
      .put('/api/v2/types/646172dcdc1f126cd5207c05')
      .set('Authorization', bearer(token))
      .send({ name: 'x', red: 'r', yellow: 'y', green: 'g', mandatory: true })
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })

  test('401 UNAUTHORIZED sin token', async () => {
    const type = await seed.createTypeV2()
    const res = await api
      .put(`/api/v2/types/${type._id}`)
      .send({ name: 'x', red: 'r', yellow: 'y', green: 'g', mandatory: true })
      .expect(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })
})

describe('DELETE /api/v2/types/:id (requirePermission catalog:manage)', () => {
  test('204 elimina', async () => {
    const { token } = await catalogAuth()
    const type = await seed.createTypeV2()
    await api
      .delete(`/api/v2/types/${type._id}`)
      .set('Authorization', bearer(token))
      .expect(204)
  })

  test('404 NOT_FOUND', async () => {
    const { token } = await catalogAuth()
    const res = await api
      .delete('/api/v2/types/646172dcdc1f126cd5207c05')
      .set('Authorization', bearer(token))
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })

  test('401 UNAUTHORIZED sin token', async () => {
    const type = await seed.createTypeV2()
    const res = await api
      .delete(`/api/v2/types/${type._id}`)
      .expect(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })
})
