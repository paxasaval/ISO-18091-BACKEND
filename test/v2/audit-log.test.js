// Tests del recurso GET /api/v2/audit-log (Tema 3: auditoría append-only).
const supertest = require('supertest')
const app = require('../../app')
const db = require('../helpers/db')
const seed = require('../helpers/seed-v2')
const AuditLog = require('../../src/v2/models/audit-log.model')

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

// Administrador tiene user:manage -> puede leer el log.
const adminAuth = async () => {
  const rol = await seed.createRolV2({ name: 'Administrador' })
  const { user } = await seed.createUserV2({ rol })
  const token = seed.signToken({ id: user._id.toString(), rol: rol._id.toString() })
  return { rol, user, token }
}

// Ciudadano no tiene user:manage -> 403.
const citizenAuth = async () => {
  const rol = await seed.createRolV2({ name: 'Ciudadano' })
  const { user } = await seed.createUserV2({ rol })
  const token = seed.signToken({ id: user._id.toString(), rol: rol._id.toString() })
  return { rol, user, token }
}

const bearer = (token) => `Bearer ${token}`

// Helper: inserta entradas de audit log directamente.
const insertLog = (actorId, action, entityType, entityId) =>
  new AuditLog({
    actor: actorId,
    action,
    entityType,
    entityId,
    timestamp: new Date()
  }).save()

describe('GET /api/v2/audit-log (auth)', () => {
  test('401 UNAUTHORIZED sin token', async () => {
    const res = await api.get('/api/v2/audit-log').expect(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  test('403 FORBIDDEN con rol sin user:manage', async () => {
    const { token } = await citizenAuth()
    const res = await api
      .get('/api/v2/audit-log')
      .set('Authorization', bearer(token))
      .expect(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })

  test('200 lista vacia', async () => {
    const { token } = await adminAuth()
    const res = await api
      .get('/api/v2/audit-log')
      .set('Authorization', bearer(token))
      .expect(200)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data).toHaveLength(0)
  })

  test('200 con entradas creadas', async () => {
    const { user, token } = await adminAuth()
    const fakeEntityId = user._id
    await insertLog(user._id, 'user.create', 'user', fakeEntityId)
    await insertLog(user._id, 'gad.create', 'gad', fakeEntityId)

    const res = await api
      .get('/api/v2/audit-log')
      .set('Authorization', bearer(token))
      .expect(200)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data).toHaveLength(2)
    expect(res.body.data[0].action).toBeDefined()
    expect(res.body.data[0].entityType).toBeDefined()
  })

  test('paginacion: meta.pagination', async () => {
    const { user, token } = await adminAuth()
    for (let i = 0; i < 5; i++) {
      await insertLog(user._id, `action.${i}`, 'gad', user._id)
    }
    const res = await api
      .get('/api/v2/audit-log?page=1&size=2')
      .set('Authorization', bearer(token))
      .expect(200)
    expect(res.body.data).toHaveLength(2)
    expect(res.body.meta.pagination.total).toBe(5)
    expect(res.body.meta.pagination.totalPages).toBe(3)
  })

  test('filtro ?entityType= devuelve solo las entradas del tipo', async () => {
    const { user, token } = await adminAuth()
    await insertLog(user._id, 'user.create', 'user', user._id)
    await insertLog(user._id, 'gad.create', 'gad', user._id)
    await insertLog(user._id, 'gad.update', 'gad', user._id)

    const res = await api
      .get('/api/v2/audit-log?entityType=gad')
      .set('Authorization', bearer(token))
      .expect(200)
    expect(res.body.data).toHaveLength(2)
    expect(res.body.data.every((e) => e.entityType === 'gad')).toBe(true)
  })

  test('filtro ?action= devuelve solo las entradas de esa accion', async () => {
    const { user, token } = await adminAuth()
    await insertLog(user._id, 'user.create', 'user', user._id)
    await insertLog(user._id, 'user.delete', 'user', user._id)
    await insertLog(user._id, 'user.create', 'user', user._id)

    const res = await api
      .get('/api/v2/audit-log?action=user.create')
      .set('Authorization', bearer(token))
      .expect(200)
    expect(res.body.data).toHaveLength(2)
    expect(res.body.data.every((e) => e.action === 'user.create')).toBe(true)
  })
})

describe('Auditoría generada por mutaciones POST /api/v2/users', () => {
  test('POST user crea entrada en audit log', async () => {
    const { user, token } = await adminAuth()
    const rol = await seed.createRolV2({ name: 'Administrador' })
    const gad = await seed.createGadV2()
    await api
      .post('/api/v2/users')
      .set('Authorization', bearer(token))
      .send({
        name: 'Auditado',
        email: 'audit@test.com',
        password: 'secret',
        rol: rol._id.toString(),
        gadId: gad._id.toString()
      })
      .expect(201)

    const logs = await AuditLog.find({ action: 'user.create' })
    expect(logs).toHaveLength(1)
    expect(logs[0].actor.toString()).toBe(user._id.toString())
    expect(logs[0].entityType).toBe('user')
  })
})
