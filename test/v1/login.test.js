const supertest = require('supertest')
const jwt = require('jsonwebtoken')
const app = require('../../app')
const db = require('../helpers/db')
const seed = require('../helpers/seed')

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

describe('POST /api/login', () => {
  test('200 con token y datos del usuario en credenciales validas', async () => {
    const { user } = await seed.createUser({ passwordPlain: 'secret123' })
    const res = await api
      .post('/api/login')
      .send({ mail: user.mail, password: 'secret123' })
      .expect(200)
    expect(res.body.token).toBeDefined()
    expect(res.body.mail).toBe(user.mail)
    expect(res.body.name).toBe(user.name)
    expect(res.body.id).toBe(user.id)
    expect(res.body.password).toBeUndefined()
    const decoded = jwt.verify(res.body.token, process.env.SECRET)
    expect(decoded.id).toBe(user.id)
    expect(decoded.mail).toBe(user.mail)
  })

  test('401 con password incorrecta', async () => {
    const { user } = await seed.createUser({ passwordPlain: 'secret123' })
    const res = await api
      .post('/api/login')
      .send({ mail: user.mail, password: 'wrong' })
      .expect(401)
    expect(res.body.error).toBe('invalid mail o password')
  })

  test('401 con mail inexistente', async () => {
    const res = await api
      .post('/api/login')
      .send({ mail: 'nope@test.com', password: 'x' })
      .expect(401)
    expect(res.body.error).toBe('invalid mail o password')
  })
})
