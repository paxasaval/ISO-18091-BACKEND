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

describe('POST /api/v2/login', () => {
  test('200 con credenciales validas -> token + user (sin password)', async () => {
    const { user, rol, passwordPlain } = await seed.createUserV2({
      email: 'metodologo@loja.gob.ec',
      passwordPlain: 'clave-segura'
    })

    const res = await api
      .post('/api/v2/login')
      .send({ email: 'metodologo@loja.gob.ec', password: passwordPlain })
      .expect(200)

    expect(res.body.data.token).toBeDefined()
    expect(res.body.data.user).toMatchObject({
      id: user._id.toString(),
      email: 'metodologo@loja.gob.ec',
      rol: rol._id.toString()
    })
    expect(res.body.data.user.password).toBeUndefined()
  })

  test('el token emitido sirve para /api/v2/me', async () => {
    const { user, passwordPlain } = await seed.createUserV2({
      email: 'user@loja.gob.ec'
    })

    const login = await api
      .post('/api/v2/login')
      .send({ email: 'user@loja.gob.ec', password: passwordPlain })
      .expect(200)

    const me = await api
      .get('/api/v2/me')
      .set('Authorization', `Bearer ${login.body.data.token}`)
      .expect(200)

    expect(me.body.data.id).toBe(user._id.toString())
  })

  test('401 con password incorrecto', async () => {
    await seed.createUserV2({ email: 'user@loja.gob.ec' })
    const res = await api
      .post('/api/v2/login')
      .send({ email: 'user@loja.gob.ec', password: 'password-erroneo' })
      .expect(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  test('401 con email inexistente', async () => {
    const res = await api
      .post('/api/v2/login')
      .send({ email: 'nadie@loja.gob.ec', password: 'x' })
      .expect(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  test('400 con body invalido (sin email)', async () => {
    const res = await api
      .post('/api/v2/login')
      .send({ password: 'x' })
      .expect(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})
