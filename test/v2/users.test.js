const supertest = require('supertest')
const app = require('../../app')
const db = require('../helpers/db')
const seed = require('../helpers/seed')
const User = require('../../models/users')

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
  const rol = await seed.createRol({ name: 'Administrador' })
  const { user } = await seed.createUser({ rol })
  const token = seed.signToken({ id: user._id.toString(), rol: rol._id.toString() })
  return { rol, user, token }
}

// Crea un rol base (Ciudadano = ROL_USER) y su token.
const baseUserAuth = async () => {
  const rol = await seed.createRol({ name: 'Ciudadano' })
  const { user } = await seed.createUser({ rol })
  const token = seed.signToken({ id: user._id.toString(), rol: rol._id.toString() })
  return { rol, user, token }
}

const bearer = (token) => `Bearer ${token}`

describe('GET /api/v2/users (auth)', () => {
  test('401 UNAUTHORIZED sin token', async () => {
    const res = await api
      .get('/api/v2/users')
      .set('tenant', '646172dcdc1f126cd5207c05')
      .expect(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  test('401 UNAUTHORIZED con token invalido', async () => {
    const res = await api
      .get('/api/v2/users')
      .set('Authorization', bearer('garbage.token.here'))
      .set('tenant', '646172dcdc1f126cd5207c05')
      .expect(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  test('200 envelope { data } por tenant header', async () => {
    const { token } = await elevatedAuth()
    const gad = await seed.createGad()
    await seed.createUser({ gadID: gad })
    const res = await api
      .get('/api/v2/users')
      .set('Authorization', bearer(token))
      .set('tenant', gad._id.toString())
      .expect(200)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].id).toBeDefined()
    expect(res.body.data[0].password).toBeUndefined()
  })

  test('400 VALIDATION_ERROR sin tenant', async () => {
    const { token } = await elevatedAuth()
    const res = await api
      .get('/api/v2/users')
      .set('Authorization', bearer(token))
      .expect(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  test('paginacion: meta.pagination', async () => {
    const { token } = await elevatedAuth()
    const gad = await seed.createGad()
    for (let i = 0; i < 4; i++) {
      await seed.createUser({ gadID: gad })
    }
    const res = await api
      .get('/api/v2/users?page=1&size=2')
      .set('Authorization', bearer(token))
      .set('tenant', gad._id.toString())
      .expect(200)
    expect(res.body.data).toHaveLength(2)
    expect(res.body.meta.pagination.total).toBe(4)
    expect(res.body.meta.pagination.totalPages).toBe(2)
  })
})

describe('GET /api/v2/users/:id (auth)', () => {
  test('200 sin password', async () => {
    const { token } = await elevatedAuth()
    const { user } = await seed.createUser()
    const res = await api
      .get(`/api/v2/users/${user._id}`)
      .set('Authorization', bearer(token))
      .expect(200)
    expect(res.body.data.id).toBe(user.id)
    expect(res.body.data.password).toBeUndefined()
  })

  test('404 NOT_FOUND', async () => {
    const { token } = await elevatedAuth()
    const res = await api
      .get('/api/v2/users/646172dcdc1f126cd5207c05')
      .set('Authorization', bearer(token))
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })
})

describe('POST /api/v2/users (rol elevado)', () => {
  test('403 FORBIDDEN con rol base (Ciudadano)', async () => {
    const { token } = await baseUserAuth()
    const rol = await seed.createRol()
    const gad = await seed.createGad()
    const res = await api
      .post('/api/v2/users')
      .set('Authorization', bearer(token))
      .send({
        name: 'Nuevo',
        mail: 'nuevo@test.com',
        password: 'plano',
        rol: rol._id.toString(),
        gadID: gad._id.toString()
      })
      .expect(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })

  test('201 crea con password hasheada (no expuesta)', async () => {
    const { token } = await elevatedAuth()
    const rol = await seed.createRol()
    const gad = await seed.createGad()
    const res = await api
      .post('/api/v2/users')
      .set('Authorization', bearer(token))
      .send({
        name: 'Nuevo',
        mail: 'nuevo@test.com',
        password: 'plano',
        rol: rol._id.toString(),
        gadID: gad._id.toString()
      })
      .expect(201)
    expect(res.body.data.id).toBeDefined()
    expect(res.body.data.password).toBeUndefined()
    const stored = await User.findById(res.body.data.id)
    expect(stored.password).not.toBe('plano')
  })

  test('400 VALIDATION_ERROR con body invalido', async () => {
    const { token } = await elevatedAuth()
    const res = await api
      .post('/api/v2/users')
      .set('Authorization', bearer(token))
      .send({ name: 'incompleto' })
      .expect(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
    expect(Array.isArray(res.body.error.details)).toBe(true)
  })
})

describe('PUT /api/v2/users/:id (rol elevado)', () => {
  test('200 actualiza', async () => {
    const { token } = await elevatedAuth()
    const { user } = await seed.createUser()
    const res = await api
      .put(`/api/v2/users/${user._id}`)
      .set('Authorization', bearer(token))
      .send({ name: 'Renombrado' })
      .expect(200)
    expect(res.body.data.name).toBe('Renombrado')
  })

  test('404 NOT_FOUND', async () => {
    const { token } = await elevatedAuth()
    const res = await api
      .put('/api/v2/users/646172dcdc1f126cd5207c05')
      .set('Authorization', bearer(token))
      .send({ name: 'X' })
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })
})

describe('DELETE /api/v2/users/:id (rol elevado)', () => {
  test('204 elimina', async () => {
    const { token } = await elevatedAuth()
    const { user } = await seed.createUser()
    await api
      .delete(`/api/v2/users/${user._id}`)
      .set('Authorization', bearer(token))
      .expect(204)
    const stored = await User.findById(user._id)
    expect(stored).toBeNull()
  })

  test('403 FORBIDDEN con rol base', async () => {
    const { token } = await baseUserAuth()
    const { user } = await seed.createUser()
    const res = await api
      .delete(`/api/v2/users/${user._id}`)
      .set('Authorization', bearer(token))
      .expect(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })
})
