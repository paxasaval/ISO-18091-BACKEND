// Biblioteca de documentos fuente: auto-poblado al subir evidencia (dedupe +
// reuso explicito) y backfill de evidencias existentes.
const supertest = require('supertest')
const app = require('../../app')
const db = require('../helpers/db')
const seed = require('../helpers/seed-v2')
const Evidence = require('../../src/v2/models/evidence.model')
const SourceDocument = require('../../src/v2/models/source-document.model')
const runBackfill = require('../../src/v2/migration/backfill-source-documents').default

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

// Autor con permiso evidence:upload (rol Responsable) + un subindicador real
// (con su instancia -> gad, para poder resolver el contexto del SourceDocument).
const setup = async () => {
  const rol = await seed.createRolV2({ name: 'Responsable' })
  const gad = await seed.createGadV2()
  const { user } = await seed.createUserV2({ rol, gadId: gad._id })
  const token = seed.signToken({
    id: user._id.toString(),
    rol: rol._id.toString()
  })
  const instance = await seed.createIndicatorInstanceV2({ gad })
  const subindicator = await seed.createSubindicatorV2({ indicatorInstance: instance })
  const characteristic = await seed.createCharacteristicV2()
  return { gad, user, token, subindicator, characteristic }
}

const evidenceBody = (subindicator, characteristic, overrides = {}) => ({
  subindicatorId: subindicator._id.toString(),
  characteristicId: characteristic._id.toString(),
  name: 'Ordenanza 2023',
  link: 'https://storage/doc-a.pdf',
  ...overrides
})

describe('POST /api/v2/evidences — auto-poblado de la biblioteca', () => {
  test('subir evidencia con link (sin sourceId) crea un SourceDocument y la enlaza', async () => {
    const { token, subindicator, characteristic, gad } = await setup()

    const res = await api
      .post('/api/v2/evidences')
      .set('Authorization', bearer(token))
      .send(evidenceBody(subindicator, characteristic))
      .expect(201)

    expect(res.body.data.sourceId).toBeDefined()

    const sources = await SourceDocument.find({})
    expect(sources).toHaveLength(1)
    expect(sources[0].link).toBe('https://storage/doc-a.pdf')
    expect(sources[0].gadId.toString()).toBe(gad._id.toString())
    expect(sources[0].verified).toBe(false)
    expect(res.body.data.sourceId.toString()).toBe(sources[0]._id.toString())
  })

  test('dedupe por nombre normalizado: mismo nombre (aunque link distinto) = un solo SourceDocument', async () => {
    const { token, subindicator, characteristic } = await setup()
    const otherCharacteristic = await seed.createCharacteristicV2()

    const r1 = await api
      .post('/api/v2/evidences')
      .set('Authorization', bearer(token))
      .send(evidenceBody(subindicator, characteristic, { name: 'PoA 2024.pdf' }))
      .expect(201)

    // Mismo documento por nombre normalizado ("poa 2024.pdf") pero subido aparte
    // (link distinto): debe reutilizar el SourceDocument, no duplicar.
    const r2 = await api
      .post('/api/v2/evidences')
      .set('Authorization', bearer(token))
      .send(
        evidenceBody(subindicator, otherCharacteristic, {
          name: 'poa  2024.pdf',
          link: 'https://storage/otra-subida.pdf'
        })
      )
      .expect(201)

    expect(await SourceDocument.countDocuments()).toBe(1)
    expect(r1.body.data.sourceId.toString()).toBe(r2.body.data.sourceId.toString())
  })

  test('nombres distintos generan documentos distintos', async () => {
    const { token, subindicator, characteristic } = await setup()
    const otherCharacteristic = await seed.createCharacteristicV2()

    await api
      .post('/api/v2/evidences')
      .set('Authorization', bearer(token))
      .send(evidenceBody(subindicator, characteristic, { name: 'Ordenanza A' }))
      .expect(201)
    await api
      .post('/api/v2/evidences')
      .set('Authorization', bearer(token))
      .send(evidenceBody(subindicator, otherCharacteristic, { name: 'Ordenanza B' }))
      .expect(201)

    expect(await SourceDocument.countDocuments()).toBe(2)
  })

  test('reuso explicito: si viene sourceId, NO se crea un documento nuevo', async () => {
    const { token, subindicator, characteristic, gad } = await setup()
    const existing = await seed.createSourceDocumentV2({ gad })

    const res = await api
      .post('/api/v2/evidences')
      .set('Authorization', bearer(token))
      .send(
        evidenceBody(subindicator, characteristic, {
          sourceId: existing._id.toString()
        })
      )
      .expect(201)

    expect(res.body.data.sourceId.toString()).toBe(existing._id.toString())
    // Solo el que sembramos: no se auto-creo otro.
    expect(await SourceDocument.countDocuments()).toBe(1)
  })
})

describe('backfill de la biblioteca', () => {
  test('runBackfill enlaza evidencias existentes sin sourceId y es idempotente', async () => {
    const { subindicator } = await setup()
    // Evidencia con link pero sin sourceId (dato "viejo").
    await seed.createEvidenceV2({
      subindicator,
      link: 'https://storage/legacy.pdf'
    })

    expect(await SourceDocument.countDocuments()).toBe(0)

    const report1 = await runBackfill({ write: true })
    expect(report1.linked).toBe(1)
    expect(await SourceDocument.countDocuments()).toBe(1)

    const linked = await Evidence.findOne({ link: 'https://storage/legacy.pdf' })
    expect(linked.sourceId).toBeDefined()

    // Segunda corrida: ya no hay candidatas -> no crea duplicados.
    const report2 = await runBackfill({ write: true })
    expect(report2.candidates).toBe(0)
    expect(await SourceDocument.countDocuments()).toBe(1)
  })

  test('dry-run no escribe', async () => {
    const { subindicator } = await setup()
    await seed.createEvidenceV2({
      subindicator,
      link: 'https://storage/legacy.pdf'
    })

    const report = await runBackfill({ write: false })
    expect(report.candidates).toBe(1)
    expect(report.linked).toBe(1) // "se enlazaria"
    expect(await SourceDocument.countDocuments()).toBe(0)
  })
})
