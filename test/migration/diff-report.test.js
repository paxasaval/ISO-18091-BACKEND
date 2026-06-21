// Test del modo READ-ONLY runDiffReport: re-deriva el diff legible comparando
// qualification de v1 (colecciones legacy) vs v2_* (recalculado), resolviendo
// nombres (subindicador, indicador/cuadrante, GAD). Usa mongodb-memory-server.

const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')
const { runDiffReport } = require('../../src/v2/migration/migrate')

// Modelos v1 (legacy) y v2 — se usan solo para obtener el nombre de colección
// correcto vía Model.collection.insertOne (bypassa validación de esquema).
const SubV1 = require('../../models/subindicator')
const InstV1 = require('../../models/indicatorInstance')
const SubV2 = require('../../src/v2/models/subindicator.model')
const InstV2 = require('../../src/v2/models/indicator-instance.model')
const IndV2 = require('../../src/v2/models/indicator.model')
const GadV2 = require('../../src/v2/models/gad.model')

const oid = () => new mongoose.Types.ObjectId()

let mongod

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})

afterEach(async () => {
  const cols = await mongoose.connection.db.collections()
  for (const c of cols) await c.deleteMany({})
})

test('runDiffReport re-deriva el diff legible con nombres resueltos', async () => {
  const gadId = oid()
  const indId = oid()
  const instId = oid()
  const subId = oid()

  // v2: catálogo + contexto (nombres)
  await GadV2.collection.insertOne({ _id: gadId, name: 'GAD Loja' })
  await IndV2.collection.insertOne({
    _id: indId,
    name: 'Participación ciudadana',
    number: 1,
    quadrant: 1,
    quadrantName: 'Democrático'
  })

  // Instancia: v1 (antes=1 rojo) vs v2 (después=0 sin evaluar)
  await InstV1.collection.insertOne({ _id: instId, qualification: 1 })
  await InstV2.collection.insertOne({
    _id: instId,
    gadId,
    indicatorInstanceId: indId,
    year: '2026',
    qualification: 0
  })

  // Subindicador: v1 (antes=2 amarillo) vs v2 (después=3 verde)
  await SubV1.collection.insertOne({ _id: subId, qualification: 2 })
  await SubV2.collection.insertOne({
    _id: subId,
    name: 'Diagnóstico',
    indicatorInstanceId: instId,
    qualification: 3
  })

  const rows = await runDiffReport()

  expect(rows).toHaveLength(2)

  const sub = rows.find((r) => r.entity === 'subindicador')
  expect(sub).toBeDefined()
  expect(sub.before).toBe(2)
  expect(sub.after).toBe(3)
  expect(sub.change).toBe('amarillo → verde')
  expect(sub.gad).toBe('GAD Loja')
  expect(sub.name).toBe('Diagnóstico')
  expect(sub.quadrant).toContain('Democrático')
  expect(sub.indicator).toContain('Participación ciudadana')
  expect(sub.year).toBe('2026')

  const inst = rows.find((r) => r.entity === 'indicador')
  expect(inst).toBeDefined()
  expect(inst.before).toBe(1)
  expect(inst.after).toBe(0)
  expect(inst.change).toBe('rojo → sin evaluar')
  expect(inst.gad).toBe('GAD Loja')
})

test('runDiffReport no incluye filas sin cambio de qualification', async () => {
  const subId = oid()
  await SubV1.collection.insertOne({ _id: subId, qualification: 2 })
  await SubV2.collection.insertOne({
    _id: subId,
    name: 'Sin cambio',
    indicatorInstanceId: oid(),
    qualification: 2
  })

  const rows = await runDiffReport()
  expect(rows).toHaveLength(0)
})
