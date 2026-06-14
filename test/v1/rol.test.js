const supertest = require('supertest')
const app = require('../../app')
const db = require('../helpers/db')
const seed = require('../helpers/seed')
const Rol = require('../../models/rol')

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

describe('GET /api/rols', () => {
  test('devuelve array vacio cuando no hay roles', async () => {
    const res = await api.get('/api/rols').expect(200)
    expect(res.body).toEqual([])
  })

  test('devuelve roles con id y sin _id/__v', async () => {
    await seed.createRol({ name: 'Admin', description: 'd' })
    const res = await api
      .get('/api/rols')
      .expect(200)
      .expect('Content-Type', /application\/json/)
    expect(res.body).toHaveLength(1)
    const rol = res.body[0]
    expect(rol.id).toBeDefined()
    expect(rol._id).toBeUndefined()
    expect(rol.__v).toBeUndefined()
    expect(rol.name).toBe('Admin')
  })
})

describe('GET /api/rols/:id', () => {
  test('devuelve el rol por id', async () => {
    const rol = await seed.createRol()
    const res = await api.get(`/api/rols/${rol._id}`).expect(200)
    expect(res.body.id).toBe(rol._id.toString())
    expect(res.body._id).toBeUndefined()
  })

  test('404 cuando no existe', async () => {
    const fakeId = '646172dcdc1f126cd5207c05'
    await api.get(`/api/rols/${fakeId}`).expect(404)
  })
})

describe('POST /api/rols', () => {
  test('crea un rol y lo devuelve formateado', async () => {
    const res = await api
      .post('/api/rols')
      .send({ name: 'Nuevo', description: 'desc' })
      .expect(200)
    expect(res.body.id).toBeDefined()
    expect(res.body._id).toBeUndefined()
    expect(res.body.name).toBe('Nuevo')
    const total = await Rol.countDocuments({})
    expect(total).toBe(1)
  })
})

describe('PUT /api/rols/:id', () => {
  test('actualiza el rol', async () => {
    const rol = await seed.createRol({ name: 'Viejo' })
    const res = await api
      .put(`/api/rols/${rol._id}`)
      .send({ name: 'Actualizado', description: 'd' })
      .expect(200)
    expect(res.body.name).toBe('Actualizado')
  })
})

describe('DELETE /api/rols/:id', () => {
  test('elimina con 204', async () => {
    const rol = await seed.createRol()
    await api.delete(`/api/rols/${rol._id}`).expect(204)
    const total = await Rol.countDocuments({})
    expect(total).toBe(0)
  })
})
