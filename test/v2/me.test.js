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

const bearer = (token) => `Bearer ${token}`

describe('GET /api/v2/me', () => {
  test('200 devuelve el usuario v2 con gadId y sin password', async () => {
    const rol = await seed.createRolV2()
    const gad = await seed.createGadV2()
    const { user } = await seed.createUserV2({ rol, gadId: gad })
    const token = seed.signToken({
      id: user._id.toString(),
      rol: rol._id.toString()
    })

    const res = await api
      .get('/api/v2/me')
      .set('Authorization', bearer(token))
      .expect(200)

    expect(res.body.data.id).toBe(user._id.toString())
    expect(res.body.data.email).toBe(user.email)
    expect(res.body.data.password).toBeUndefined()
    // tenant/workspace: gadId poblado -> objeto con id del gad.
    expect(res.body.data.gadId.id).toBe(gad._id.toString())
    expect(res.body.data.rol.id).toBe(rol._id.toString())
  })

  test('401 UNAUTHORIZED sin token', async () => {
    const res = await api.get('/api/v2/me').expect(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  test('401 UNAUTHORIZED con token invalido', async () => {
    const res = await api
      .get('/api/v2/me')
      .set('Authorization', bearer('garbage.token.here'))
      .expect(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  test('404 NOT_FOUND si el usuario del token no existe', async () => {
    const rol = await seed.createRolV2()
    const token = seed.signToken({
      id: '646172dcdc1f126cd5207c05',
      rol: rol._id.toString()
    })
    const res = await api
      .get('/api/v2/me')
      .set('Authorization', bearer(token))
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })
})
