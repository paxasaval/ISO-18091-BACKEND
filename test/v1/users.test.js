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

describe('GET /api/users', () => {
  test('400 cuando falta el header tenant', async () => {
    const res = await api.get('/api/users').expect(400)
    expect(res.body.message).toBe('tenant is nessesary')
  })

  test('mensaje cuando no hay usuarios en el workspace', async () => {
    const gad = await seed.createGad()
    const res = await api
      .get('/api/users')
      .set('tenant', gad._id.toString())
      .expect(200)
    expect(res.body.message).toBe('no users in worskpace')
  })

  test('devuelve usuarios del tenant sin password y con id', async () => {
    const gad = await seed.createGad()
    await seed.createUser({ gadID: gad })
    const res = await api
      .get('/api/users')
      .set('tenant', gad._id.toString())
      .expect(200)
      .expect('Content-Type', /application\/json/)
    expect(res.body).toHaveLength(1)
    const user = res.body[0]
    expect(user.id).toBeDefined()
    expect(user._id).toBeUndefined()
    expect(user.password).toBeUndefined()
    expect(user.__v).toBeUndefined()
  })
})

describe('GET /api/users/:id', () => {
  test('devuelve el usuario por id sin password', async () => {
    const { user } = await seed.createUser()
    const res = await api.get(`/api/users/${user._id}`).expect(200)
    expect(res.body.id).toBe(user.id)
    expect(res.body.password).toBeUndefined()
  })

  test('404 cuando no existe', async () => {
    await api.get('/api/users/646172dcdc1f126cd5207c05').expect(404)
  })
})

describe('POST /api/users/signUp', () => {
  test('400 cuando falta tenant', async () => {
    const rol = await seed.createRol()
    const res = await api
      .post('/api/users/signUp')
      .send({ name: 'X', mail: 'x@test.com', password: 'p', rol: rol._id })
      .expect(400)
    expect(res.body.error).toBe('Need tenantID by workspace')
  })

  test('crea el usuario con password hasheada (no en texto plano)', async () => {
    const rol = await seed.createRol()
    const gad = await seed.createGad()
    const res = await api
      .post('/api/users/signUp')
      .set('tenant', gad._id.toString())
      .send({ name: 'Nuevo', mail: 'nuevo@test.com', password: 'plano', rol: rol._id })
      .expect(200)
    expect(res.body.id).toBeDefined()
    expect(res.body.password).toBeUndefined()
    const stored = await User.findById(res.body.id)
    expect(stored.password).not.toBe('plano')
  })
})

describe('POST /api/users/password', () => {
  test('true cuando la password coincide', async () => {
    const { user } = await seed.createUser({ passwordPlain: 'secret123' })
    const res = await api
      .post('/api/users/password')
      .send({ mail: user.mail, password: 'secret123' })
      .expect(200)
    expect(res.body).toBe(true)
  })

  test('false cuando la password no coincide', async () => {
    const { user } = await seed.createUser({ passwordPlain: 'secret123' })
    const res = await api
      .post('/api/users/password')
      .send({ mail: user.mail, password: 'mala' })
      .expect(200)
    expect(res.body).toBe(false)
  })
})

describe('DELETE /api/users/:id', () => {
  test('elimina con 204', async () => {
    const { user } = await seed.createUser()
    await api.delete(`/api/users/${user._id}`).expect(204)
    const total = await User.countDocuments({})
    expect(total).toBe(0)
  })
})
