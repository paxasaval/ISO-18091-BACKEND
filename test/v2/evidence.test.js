const supertest = require('supertest')
const app = require('../../app')
const db = require('../helpers/db')
const seed = require('../helpers/seed')
const seedV2 = require('../helpers/seed-v2')
const Evidence = require('../../models/evidence')
const SubIndicator = require('../../models/subindicator')

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
  const rol = await seedV2.createRolV2({ name: 'Administrador' })
  const { user } = await seed.createUser({ rol })
  const token = seed.signToken({
    id: user._id.toString(),
    rol: rol._id.toString()
  })
  return { rol, user, token }
}

const responsibleAuth = async () => {
  const rol = await seedV2.createRolV2({ name: 'Responsable' })
  const { user } = await seed.createUser({ rol })
  const token = seed.signToken({
    id: user._id.toString(),
    rol: rol._id.toString()
  })
  return { rol, user, token }
}

const baseUserAuth = async () => {
  const rol = await seedV2.createRolV2({ name: 'Ciudadano' })
  const { user } = await seed.createUser({ rol })
  const token = seed.signToken({
    id: user._id.toString(),
    rol: rol._id.toString()
  })
  return { rol, user, token }
}

const bearer = (token) => `Bearer ${token}`

// Construye el grafo completo necesario para el recalc:
// gad -> indicatorInstance -> subindicator (typeID con characteristics).
const seedGraph = async () => {
  const gad = await seed.createGad({ publishAuto: false })
  const characteristic = await seed.createCharacteristic({ score: 5, tier: 1 })
  const type = await seed.createType({
    mandatory: true,
    characteristics: [characteristic._id]
  })
  const instance = await seed.createIndicatorInstance({ gadID: gad })
  const sub = await seed.createSubIndicator({
    indicadorID: instance,
    typeID: type
  })
  return { gad, characteristic, type, instance, sub }
}

describe('GET /api/v2/evidences', () => {
  test('200 envelope { data }', async () => {
    await seed.createEvidence()
    const res = await api.get('/api/v2/evidences').expect(200)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data).toHaveLength(1)
  })

  test('filtra por ?subindicator=', async () => {
    const ev = await seed.createEvidence()
    await seed.createEvidence()
    const res = await api
      .get(`/api/v2/evidences?subindicator=${ev.subIndicatorID}`)
      .expect(200)
    expect(res.body.data).toHaveLength(1)
  })

  test('400 size invalido', async () => {
    const res = await api.get('/api/v2/evidences?size=0').expect(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('GET /api/v2/evidences/:id', () => {
  test('200', async () => {
    const ev = await seed.createEvidence()
    const res = await api.get(`/api/v2/evidences/${ev._id}`).expect(200)
    expect(res.body.data.id).toBe(ev._id.toString())
  })

  test('404 NOT_FOUND', async () => {
    const res = await api
      .get('/api/v2/evidences/646172dcdc1f126cd5207c05')
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })

  test('400 INVALID_ID', async () => {
    const res = await api.get('/api/v2/evidences/bad').expect(400)
    expect(res.body.error.code).toBe('INVALID_ID')
  })
})

describe('POST /api/v2/evidences (auth)', () => {
  test('401 sin token', async () => {
    const { sub, characteristic } = await seedGraph()
    const res = await api
      .post('/api/v2/evidences')
      .send({
        characteristicID: characteristic._id.toString(),
        subIndicatorID: sub._id.toString(),
        name: 'Ev'
      })
      .expect(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  test('403 con rol base (Ciudadano)', async () => {
    const { token } = await baseUserAuth()
    const { sub, characteristic } = await seedGraph()
    const res = await api
      .post('/api/v2/evidences')
      .set('Authorization', bearer(token))
      .send({
        characteristicID: characteristic._id.toString(),
        subIndicatorID: sub._id.toString(),
        name: 'Ev'
      })
      .expect(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })

  test('201 crea + recalcula subindicador (flujo POST evidence -> recalc)', async () => {
    const { token } = await responsibleAuth()
    const { gad, sub, characteristic } = await seedGraph()
    const res = await api
      .post('/api/v2/evidences')
      .set('Authorization', bearer(token))
      .set('tenant', gad._id.toString())
      .send({
        characteristicID: characteristic._id.toString(),
        subIndicatorID: sub._id.toString(),
        name: 'Ev Nueva',
        link: 'http://test/doc',
        qualification: 3
      })
      .expect(201)
    expect(res.body.data.id).toBeDefined()
    // recalcSubindicatorFromEvidence con includeNewEvidence:true: 1 evidencia
    // qualify=3 sobre la unica caracteristica (score 5) -> score=3, totalScore=5,
    // percent 0.6 -> qualification 2.
    const updatedSub = await SubIndicator.findById(sub._id)
    expect(updatedSub.totalScore).toBe(5)
    expect(updatedSub.score).toBe(3)
    expect(updatedSub.qualification).toBe(2)
  })

  test('400 body invalido', async () => {
    const { token } = await responsibleAuth()
    const res = await api
      .post('/api/v2/evidences')
      .set('Authorization', bearer(token))
      .send({ name: 'x' })
      .expect(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('PUT /api/v2/evidences/:id/qualify (ADMIN)', () => {
  test('401 sin token', async () => {
    const ev = await seed.createEvidence()
    const res = await api
      .put(`/api/v2/evidences/${ev._id}/qualify`)
      .send({ qualification: 2 })
      .expect(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  test('403 con rol Responsable (no ADMIN)', async () => {
    const { token } = await responsibleAuth()
    const ev = await seed.createEvidence()
    const res = await api
      .put(`/api/v2/evidences/${ev._id}/qualify`)
      .set('Authorization', bearer(token))
      .send({ qualification: 2 })
      .expect(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })

  test('200 califica (ADMIN)', async () => {
    const { token, user } = await elevatedAuth()
    const { gad, sub, characteristic } = await seedGraph()
    const ev = await seed.createEvidence({
      subIndicatorID: sub,
      characteristicID: characteristic
    })
    const res = await api
      .put(`/api/v2/evidences/${ev._id}/qualify`)
      .set('Authorization', bearer(token))
      .set('tenant', gad._id.toString())
      .send({ qualification: 3, user: user._id.toString(), rubric: [] })
      .expect(200)
    expect(res.body.data.qualification).toBe(3)
  })

  test('404 qualify sobre evidencia inexistente', async () => {
    const { token } = await elevatedAuth()
    const res = await api
      .put('/api/v2/evidences/646172dcdc1f126cd5207c05/qualify')
      .set('Authorization', bearer(token))
      .send({ qualification: 2, rubric: [] })
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })
})

describe('PUT /api/v2/evidences/:id', () => {
  test('200 actualiza', async () => {
    const ev = await seed.createEvidence()
    const res = await api
      .put(`/api/v2/evidences/${ev._id}`)
      .send({
        name: 'Editada',
        characteristicID: ev.characteristicID.toString(),
        subIndicatorID: ev.subIndicatorID.toString()
      })
      .expect(200)
    expect(res.body.data.name).toBe('Editada')
  })

  test('404 NOT_FOUND', async () => {
    const res = await api
      .put('/api/v2/evidences/646172dcdc1f126cd5207c05')
      .send({
        name: 'x',
        characteristicID: '646172dcdc1f126cd5207c05',
        subIndicatorID: '646172dcdc1f126cd5207c05'
      })
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })
})

describe('DELETE /api/v2/evidences/:id (ADMIN)', () => {
  test('403 con rol Responsable', async () => {
    const { token } = await responsibleAuth()
    const ev = await seed.createEvidence()
    const res = await api
      .delete(`/api/v2/evidences/${ev._id}`)
      .set('Authorization', bearer(token))
      .expect(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })

  test('204 elimina y re-califica (ADMIN)', async () => {
    const { token } = await elevatedAuth()
    const { sub, characteristic } = await seedGraph()
    const ev = await seed.createEvidence({
      subIndicatorID: sub,
      characteristicID: characteristic
    })
    await api
      .delete(`/api/v2/evidences/${ev._id}`)
      .set('Authorization', bearer(token))
      .expect(204)
    expect(await Evidence.findById(ev._id)).toBeNull()
  })

  test('404 DELETE NOT_FOUND', async () => {
    const { token } = await elevatedAuth()
    const res = await api
      .delete('/api/v2/evidences/646172dcdc1f126cd5207c05')
      .set('Authorization', bearer(token))
      .expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })
})
