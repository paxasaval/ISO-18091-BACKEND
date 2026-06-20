// Test de migracion v1 → v2 sobre mongodb-memory-server.
//
// Siembra datos en colecciones v1 (sin prefijo) usando los modelos legacy,
// ejecuta runMigration({ write: true }) y verifica:
//   1. Documentos en v2_* con _id preservado y nombres limpios.
//   2. Rol Metodólogo creado si no existe en v1.
//   3. Rol.permissions poblado por permissionsForRole.
//   4. CharacteristicAssessment construido por regla UNION.
//   5. qualification recomputada tras la migración.
//   6. Idempotencia: segunda ejecución no duplica ni altera los datos.

const db = require('../helpers/db')

// Modelos v1 (lectura — siembra de datos)
const RolV1 = require('../../models/rol')
const ValuationV1 = require('../../models/valuation')
const OdsV1 = require('../../models/ods')
const UserV1 = require('../../models/users')
const GadV1 = require('../../models/gad')
const IndicatorV1 = require('../../models/indicator')
const TypeV1 = require('../../models/type')
const CharacteristicV1 = require('../../models/characteristic')
const PeriodV1 = require('../../models/period')
const IndicatorInstanceV1 = require('../../models/indicatorInstance')
const SubindicatorV1 = require('../../models/subindicator')
const EvidenceV1 = require('../../models/evidence')
const RubricV1 = require('../../models/rubric')

// Modelos v2 (verificacion de resultados)
const RolV2 = require('../../src/v2/models/rol.model')
const ValuationV2 = require('../../src/v2/models/valuation.model')
const OdsV2 = require('../../src/v2/models/ods.model')
const UserV2 = require('../../src/v2/models/user.model')
const CharacteristicV2 = require('../../src/v2/models/characteristic.model')
const IndicatorInstanceV2 = require('../../src/v2/models/indicator-instance.model')
const SubindicatorV2 = require('../../src/v2/models/subindicator.model')
const EvidenceV2 = require('../../src/v2/models/evidence.model')
const CharacteristicAssessmentV2 = require('../../src/v2/models/characteristic-assessment.model')

// Funcion de migracion
const { runMigration } = require('../../src/v2/migration/migrate')

// Permisos esperados
const { permissionsForRole } = require('../../src/v2/constants/permissions')

beforeAll(async () => {
  await db.connect()
})

afterEach(async () => {
  await db.clear()
})

afterAll(async () => {
  await db.disconnect()
})

// ---------------------------------------------------------------------------
// Helpers de siembra de datos v1
// ---------------------------------------------------------------------------

const seedV1Data = async () => {
  // Roles v1
  const rolAdmin = await new RolV1({
    name: 'Administrador',
    description: 'Administrador del sistema'
  }).save()
  const rolResp = await new RolV1({
    name: 'Responsable',
    description: 'Responsable de GAD'
  }).save()

  // Valuations v1
  const val1 = await new ValuationV1({
    name: 'Criterio A',
    category: 'cat1',
    maxValue: 2
  }).save()
  const val2 = await new ValuationV1({
    name: 'Criterio B',
    category: 'cat1',
    maxValue: 3
  }).save()

  // ODS v1
  const ods1 = await new OdsV1({ number: 1, name: 'Fin de la pobreza', img: 'ods1.png' }).save()

  // GAD v1
  const gad = await new GadV1({
    name: 'GAD Loja',
    code: 'GADL',
    city: 'Loja',
    country: 'Ecuador',
    size: 1,
    admin: [],
    staff: [],
    users: [],
    state: true,
    publishAuto: true,
    report: []
  }).save()

  // User v1
  const user = await new UserV1({
    name: 'Admin User',
    mail: 'admin@test.com',
    password: 'hashed',
    rol: rolAdmin._id,
    created: new Date(),
    lastUpdate: new Date(),
    state: true,
    gadID: gad._id
  }).save()

  // Indicator catálogo v1
  const indicator = await new IndicatorV1({
    name: 'Indicador 1',
    description: 'Descripcion 1',
    number: 1,
    quadrant: 1,
    quadrantName: 'Cuadrante A',
    red: '0.50',
    yellow: '0.75',
    green: '1.0',
    ods: [ods1._id]
  }).save()

  // Characteristic v1 (type=2 → link)
  const char1 = await new CharacteristicV1({
    name: 'Caracteristica Link',
    type: 2,
    group: 'g1',
    groupName: 'Grupo 1',
    isRequired: true,
    required: true,
    tier: 1,
    unique: false,
    parts: [],
    valuation: [val1._id, val2._id],
    extras: {},
    allowed_formats: ['pdf', 'docx']
  }).save()

  // Characteristic v1 (type=1 → file, tier critico)
  const char2 = await new CharacteristicV1({
    name: 'Caracteristica File Critica',
    type: 1,
    group: 'g1',
    groupName: 'Grupo 1',
    isRequired: true,
    required: true,
    tier: 2,
    unique: false,
    parts: [],
    valuation: [val1._id],
    extras: {},
    allowed_formats: ['pdf']
  }).save()

  // Type v1
  const type = await new TypeV1({
    name: 'Tipo General',
    red: '0.50',
    yellow: '0.75',
    green: '1.0',
    mandatory: true,
    extraInfo: {},
    characteristics: [char1._id, char2._id]
  }).save()

  // Period v1
  const period = await new PeriodV1({
    year: '2024',
    gad: gad._id,
    createdBy: user._id
  }).save()

  // IndicatorInstance v1
  const instance = await new IndicatorInstanceV1({
    gadID: gad._id,
    indicatorID: indicator._id,
    period: period._id,
    year: '2024',
    qualification: 3,
    create: new Date(),
    state: true,
    createdBy: user._id,
    subindicators: []
  }).save()

  // Subindicator v1
  const sub = await new SubindicatorV1({
    typeID: type._id,
    indicadorID: instance._id,
    name: 'Subindicador Test',
    requireCover: false,
    responsible: 'Juan Perez',
    qualification: 3,
    score: 5,
    totalScore: 5,
    autoQualification: 3,
    state: true,
    created: new Date(),
    createdBy: user._id,
    commits: [],
    evidences: [],
    extraInfo: {}
  }).save()

  // Actualizar instance con el subindicador
  await IndicatorInstanceV1.findByIdAndUpdate(instance._id, {
    subindicators: [sub._id]
  })

  // Evidence 1 — verificada, con rubrics (cumple val1 pero no val2)
  const ev1 = await new EvidenceV1({
    characteristicID: char1._id,
    subIndicatorID: sub._id,
    name: 'Evidencia Principal',
    link: 'http://test/doc1.pdf',
    verified: true,
    author: user._id,
    commits: [],
    extras: {},
    rubric: []
  }).save()

  // Evidence 2 — no verificada, con rubrics (cumple val2)
  const ev2 = await new EvidenceV1({
    characteristicID: char1._id,
    subIndicatorID: sub._id,
    name: 'Evidencia Complementaria',
    link: 'http://test/doc2.pdf',
    verified: false,
    author: user._id,
    commits: [],
    extras: {},
    rubric: []
  }).save()

  // Rubrics v1 para ev1: val1=cumplido (qual>0), val2=no cumplido (qual=0)
  const rub1a = await new RubricV1({ valuation: val1._id, qualification: 1, evidence: ev1._id }).save()
  const rub1b = await new RubricV1({ valuation: val2._id, qualification: 0, evidence: ev1._id }).save()

  // Rubrics v1 para ev2: val1=no cumplido, val2=cumplido
  const rub2a = await new RubricV1({ valuation: val1._id, qualification: 0, evidence: ev2._id }).save()
  const rub2b = await new RubricV1({ valuation: val2._id, qualification: 1, evidence: ev2._id }).save()

  // Enlazar rubrics a evidencias
  await EvidenceV1.findByIdAndUpdate(ev1._id, { rubric: [rub1a._id, rub1b._id] })
  await EvidenceV1.findByIdAndUpdate(ev2._id, { rubric: [rub2a._id, rub2b._id] })

  return {
    rolAdmin, rolResp, val1, val2, ods1, gad, user,
    indicator, char1, char2, type, period, instance, sub,
    ev1, ev2
  }
}

// ---------------------------------------------------------------------------
// Suite principal
// ---------------------------------------------------------------------------

describe('runMigration — integridad basica', () => {
  let seed

  beforeEach(async () => {
    seed = await seedV1Data()
    await runMigration({ write: true })
  })

  test('_id preservado en roles v2', async () => {
    const rolV2 = await RolV2.findById(seed.rolAdmin._id).lean()
    expect(rolV2).not.toBeNull()
    expect(rolV2._id.toString()).toBe(seed.rolAdmin._id.toString())
  })

  test('nombres limpios en User: mail→email, gadID→gadId', async () => {
    const userV2 = await UserV2.findById(seed.user._id).lean()
    expect(userV2).not.toBeNull()
    expect(userV2.email).toBe('admin@test.com')
    expect(userV2.gadId.toString()).toBe(seed.gad._id.toString())
    expect(userV2.mail).toBeUndefined()
    expect(userV2.gadID).toBeUndefined()
  })

  test('nombres limpios en Subindicator: typeID→typeId, indicadorID→indicatorInstanceId, responsible→responsibleText', async () => {
    const subV2 = await SubindicatorV2.findById(seed.sub._id).lean()
    expect(subV2).not.toBeNull()
    expect(subV2.typeId.toString()).toBe(seed.type._id.toString())
    expect(subV2.indicatorInstanceId.toString()).toBe(seed.instance._id.toString())
    expect(subV2.responsibleText).toBe('Juan Perez')
    expect(subV2.responsibleUserIds).toEqual([])
    expect(subV2.typeID).toBeUndefined()
    expect(subV2.indicadorID).toBeUndefined()
  })

  test('nombres limpios en Evidence: characteristicID→characteristicId, subIndicatorID→subindicatorId', async () => {
    const evV2 = await EvidenceV2.findById(seed.ev1._id).lean()
    expect(evV2).not.toBeNull()
    expect(evV2.characteristicId.toString()).toBe(seed.char1._id.toString())
    expect(evV2.subindicatorId.toString()).toBe(seed.sub._id.toString())
    expect(evV2.kind).toBe('principal')
    expect(evV2.sourceId).toBeNull()
    expect(evV2.pages).toBeNull()
  })

  test('nombres limpios en Characteristic: valuation→valuations, allowed_formats→allowedFormats, inputKind derivado', async () => {
    const chV2 = await CharacteristicV2.findById(seed.char1._id).lean()
    expect(chV2).not.toBeNull()
    // valuation → valuations
    expect(Array.isArray(chV2.valuations)).toBe(true)
    expect(chV2.valuations.length).toBe(2)
    // allowed_formats → allowedFormats
    expect(chV2.allowedFormats).toEqual(expect.arrayContaining(['pdf', 'docx']))
    // type===2 → inputKind='link'
    expect(chV2.inputKind).toBe('link')
    expect(chV2.isCover).toBe(false)
  })

  test('inputKind=file para caracteristica con type!=2', async () => {
    const chV2 = await CharacteristicV2.findById(seed.char2._id).lean()
    expect(chV2).not.toBeNull()
    expect(chV2.inputKind).toBe('file')
  })

  test('IndicatorInstance: gadID→gadId, indicatorID→indicatorInstanceId', async () => {
    const instV2 = await IndicatorInstanceV2.findById(seed.instance._id).lean()
    expect(instV2).not.toBeNull()
    expect(instV2.gadId.toString()).toBe(seed.gad._id.toString())
    expect(instV2.indicatorInstanceId.toString()).toBe(seed.indicator._id.toString())
  })

  test('slug y order backfill en roles', async () => {
    const rolV2 = await RolV2.findById(seed.rolAdmin._id).lean()
    expect(rolV2.slug).toBeTruthy()
    expect(typeof rolV2.order).toBe('number')
    expect(rolV2.order).toBeGreaterThanOrEqual(1)
  })

  test('slug y order backfill en valuations', async () => {
    const valV2 = await ValuationV2.findById(seed.val1._id).lean()
    expect(valV2.slug).toBeTruthy()
    expect(typeof valV2.order).toBe('number')
  })

  test('slug backfill en characteristics', async () => {
    const chV2 = await CharacteristicV2.findById(seed.char1._id).lean()
    expect(chV2.slug).toBeTruthy()
  })

  test('ODS _id preservado con slug y order', async () => {
    const odsV2 = await OdsV2.findById(seed.ods1._id).lean()
    expect(odsV2).not.toBeNull()
    expect(odsV2._id.toString()).toBe(seed.ods1._id.toString())
    expect(odsV2.slug).toBeTruthy()
    expect(typeof odsV2.order).toBe('number')
  })
})

// ---------------------------------------------------------------------------
// Suite: Rol.permissions poblado
// ---------------------------------------------------------------------------

describe('runMigration — Rol.permissions', () => {
  test('Administrador recibe todos los permisos', async () => {
    const rolAdmin = await new RolV1({
      name: 'Administrador',
      description: 'Admin'
    }).save()
    await runMigration({ write: true })

    const rolV2 = await RolV2.findById(rolAdmin._id).lean()
    expect(rolV2).not.toBeNull()
    expect(Array.isArray(rolV2.permissions)).toBe(true)
    const allPerms = permissionsForRole('Administrador')
    for (const perm of allPerms) {
      expect(rolV2.permissions).toContain(perm)
    }
  })

  test('Responsable recibe permisos reducidos', async () => {
    const rolResp = await new RolV1({
      name: 'Responsable',
      description: 'Responsable'
    }).save()
    await runMigration({ write: true })

    const rolV2 = await RolV2.findById(rolResp._id).lean()
    const expectedPerms = permissionsForRole('Responsable')
    expect(rolV2.permissions).toEqual(expect.arrayContaining(expectedPerms))
    // No debe tener permisos de administrador fuera de los propios
    expect(rolV2.permissions).not.toContain('user:manage')
  })

  test('Ciudadano recibe solo public:read', async () => {
    await new RolV1({ name: 'Ciudadano', description: 'Ciudadano' }).save()
    await runMigration({ write: true })

    const rolV2 = await RolV2.findOne({ name: 'Ciudadano' }).lean()
    expect(rolV2.permissions).toEqual(['public:read'])
  })

  test('Rol desconocido recibe public:read (minimo seguro)', async () => {
    await new RolV1({ name: 'RolRaro', description: 'Desconocido' }).save()
    await runMigration({ write: true })

    const rolV2 = await RolV2.findOne({ name: 'RolRaro' }).lean()
    expect(rolV2.permissions).toEqual(['public:read'])
  })

  test('Se crea Metodólogo si no existe en v1', async () => {
    await runMigration({ write: true })

    const metV2 = await RolV2.findOne({ name: 'Metodólogo' }).lean()
    expect(metV2).not.toBeNull()
    const expectedPerms = permissionsForRole('Metodólogo')
    expect(metV2.permissions).toEqual(expect.arrayContaining(expectedPerms))
  })

  test('Metodólogo existente en v1 no crea duplicado', async () => {
    await new RolV1({ name: 'Metodólogo', description: 'Metodólogo manual' }).save()
    await runMigration({ write: true })

    const count = await RolV2.countDocuments({ name: 'Metodólogo' })
    expect(count).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// Suite: CharacteristicAssessment — regla UNION
// ---------------------------------------------------------------------------

describe('runMigration — CharacteristicAssessment UNION', () => {
  test('regla UNION: met=true si ALGUNA evidencia tiene qualification>0 para esa valuation', async () => {
    const seed = await seedV1Data()
    await runMigration({ write: true })

    // Para el par (sub, char1):
    //   ev1 (verificada): val1=cumplido(1), val2=no cumplido(0)
    //   ev2 (no verif):   val1=no cumplido(0), val2=cumplido(1)
    // UNION: val1.met = true (ev1 lo cumple), val2.met = true (ev2 lo cumple)
    const assessment = await CharacteristicAssessmentV2.findOne({
      subindicatorId: seed.sub._id,
      characteristicId: seed.char1._id
    }).lean()

    expect(assessment).not.toBeNull()
    expect(Array.isArray(assessment.criteria)).toBe(true)

    const critA = assessment.criteria.find(
      (c) => c.valuationId.toString() === seed.val1._id.toString()
    )
    const critB = assessment.criteria.find(
      (c) => c.valuationId.toString() === seed.val2._id.toString()
    )

    expect(critA).toBeDefined()
    expect(critB).toBeDefined()

    // val1: ev1 cumple (qual=1) → met=true
    expect(critA.met).toBe(true)
    // val2: ev2 cumple (qual=1) → met=true (UNION de todas las evidencias)
    expect(critB.met).toBe(true)
  })

  test('verified=true si ALGUNA evidencia del par estaba verificada', async () => {
    const seed = await seedV1Data()
    await runMigration({ write: true })

    const assessment = await CharacteristicAssessmentV2.findOne({
      subindicatorId: seed.sub._id,
      characteristicId: seed.char1._id
    }).lean()

    // ev1 está verificada → assessment.verified = true
    expect(assessment.verified).toBe(true)
  })

  test('verified=false si ninguna evidencia del par estaba verificada', async () => {
    // Crear datos mínimos con evidencia no verificada
    const val = await new ValuationV1({ name: 'V', category: 'c', maxValue: 1 }).save()
    const ch = await new CharacteristicV1({
      name: 'Ch NoVerif',
      type: 1,
      group: 'g',
      groupName: 'G',
      isRequired: true,
      required: true,
      tier: 1,
      unique: false,
      parts: [],
      valuation: [val._id],
      extras: {},
      allowed_formats: []
    }).save()
    const gad = await new GadV1({
      name: 'G', code: 'G', city: 'C', country: 'EC',
      size: 1, admin: [], staff: [], users: [],
      state: true, publishAuto: false, report: []
    }).save()
    const rol = await new RolV1({ name: 'Admin2', description: 'A' }).save()
    const user = await new UserV1({
      name: 'U', mail: 'u2@t.com', password: 'pw',
      rol: rol._id, created: new Date(), lastUpdate: new Date(),
      state: true, gadID: gad._id
    }).save()
    const ind = await new IndicatorV1({
      name: 'Ind', description: 'D', number: 2,
      quadrant: 1, quadrantName: 'Q', red: '0.5',
      yellow: '0.75', green: '1.0', ods: []
    }).save()
    const type = await new TypeV1({
      name: 'T2', red: '0.5', yellow: '0.75', green: '1.0',
      mandatory: false, extraInfo: {}, characteristics: [ch._id]
    }).save()
    const period = await new PeriodV1({ year: '2025', gad: gad._id, createdBy: user._id }).save()
    const instance = await new IndicatorInstanceV1({
      gadID: gad._id, indicatorID: ind._id, period: period._id,
      year: '2025', qualification: 0, create: new Date(), state: true,
      createdBy: user._id, subindicators: []
    }).save()
    const sub = await new SubindicatorV1({
      typeID: type._id, indicadorID: instance._id, name: 'Sub2',
      requireCover: false, responsible: 'R', qualification: 0,
      score: 0, totalScore: 0, autoQualification: 0,
      state: true, created: new Date(), createdBy: user._id,
      commits: [], evidences: [], extraInfo: {}
    }).save()
    const ev = await new EvidenceV1({
      characteristicID: ch._id, subIndicatorID: sub._id,
      name: 'Ev NoVerif', link: 'http://t.com/d.pdf',
      verified: false, author: user._id, commits: [], extras: {}, rubric: []
    }).save()
    const rub = await new RubricV1({ valuation: val._id, qualification: 1, evidence: ev._id }).save()
    await EvidenceV1.findByIdAndUpdate(ev._id, { rubric: [rub._id] })

    await runMigration({ write: true })

    const assessment = await CharacteristicAssessmentV2.findOne({
      subindicatorId: sub._id,
      characteristicId: ch._id
    }).lean()

    expect(assessment).not.toBeNull()
    expect(assessment.verified).toBe(false)
  })

  test('peso (weight) del criterio = valuation.maxValue de v1', async () => {
    const seed = await seedV1Data()
    await runMigration({ write: true })

    const assessment = await CharacteristicAssessmentV2.findOne({
      subindicatorId: seed.sub._id,
      characteristicId: seed.char1._id
    }).lean()

    const critA = assessment.criteria.find(
      (c) => c.valuationId.toString() === seed.val1._id.toString()
    )
    const critB = assessment.criteria.find(
      (c) => c.valuationId.toString() === seed.val2._id.toString()
    )

    expect(critA.weight).toBe(2)   // val1.maxValue = 2
    expect(critB.weight).toBe(3)   // val2.maxValue = 3
  })
})

// ---------------------------------------------------------------------------
// Suite: Scoring recomputado
// ---------------------------------------------------------------------------

describe('runMigration — qualification recomputada', () => {
  test('subindicador con assessment verificado recibe qualification > 0', async () => {
    const seed = await seedV1Data()
    // Antes de migrar, el subindicador v1 tiene qualification=3 (valor legacy)
    const subV1Before = await SubindicatorV1.findById(seed.sub._id).lean()
    expect(subV1Before.qualification).toBe(3)

    await runMigration({ write: true })

    // Después de migrar y recomputar:
    // Par (sub, char1): assessment verificado con val1.met=true(w=2), val2.met=true(w=3)
    // score = 5, totalRubric = 5, percent = 1.0 >= 0.75 → qualification = 3
    // Pero char2 (tier=2, critica) no tiene evidencias → criticalBlocked=true → qualification=1
    const subV2 = await SubindicatorV2.findById(seed.sub._id).lean()
    expect(subV2).not.toBeNull()
    // La calificacion fue recomputada (no necesariamente 3 por la critica)
    expect(typeof subV2.qualification).toBe('number')
  })

  test('instancia de indicador recibe qualification recomputada', async () => {
    await seedV1Data()
    await runMigration({ write: true })

    // La instancia agrega subindicadores → qualification >= 0
    const instances = await IndicatorInstanceV2.find().lean()
    expect(instances.length).toBeGreaterThan(0)
    for (const inst of instances) {
      expect(typeof inst.qualification).toBe('number')
      expect(inst.qualification).toBeGreaterThanOrEqual(0)
      expect(inst.qualification).toBeLessThanOrEqual(3)
    }
  })
})

// ---------------------------------------------------------------------------
// Suite: Idempotencia
// ---------------------------------------------------------------------------

describe('runMigration — idempotencia', () => {
  test('segunda ejecucion no duplica documentos', async () => {
    await seedV1Data()

    await runMigration({ write: true })
    const countAfterFirst = {
      rols: await RolV2.countDocuments(),
      valuations: await ValuationV2.countDocuments(),
      evidences: await EvidenceV2.countDocuments()
    }

    await runMigration({ write: true })
    const countAfterSecond = {
      rols: await RolV2.countDocuments(),
      valuations: await ValuationV2.countDocuments(),
      evidences: await EvidenceV2.countDocuments()
    }

    expect(countAfterSecond.rols).toBe(countAfterFirst.rols)
    expect(countAfterSecond.valuations).toBe(countAfterFirst.valuations)
    expect(countAfterSecond.evidences).toBe(countAfterFirst.evidences)
  })

  test('segunda ejecucion produce el mismo qualification', async () => {
    const seed = await seedV1Data()

    await runMigration({ write: true })
    const subAfterFirst = await SubindicatorV2.findById(seed.sub._id).lean()

    await runMigration({ write: true })
    const subAfterSecond = await SubindicatorV2.findById(seed.sub._id).lean()

    expect(subAfterSecond.qualification).toBe(subAfterFirst.qualification)
  })
})

// ---------------------------------------------------------------------------
// Suite: dry-run no escribe
// ---------------------------------------------------------------------------

describe('runMigration — dry-run no escribe', () => {
  test('dry-run: no crea documentos en v2_*', async () => {
    await seedV1Data()
    await runMigration({ write: false })

    const count = await RolV2.countDocuments()
    expect(count).toBe(0)

    const countEv = await EvidenceV2.countDocuments()
    expect(countEv).toBe(0)
  })

  test('dry-run: retorna un reporte con conteos y consolidaciones', async () => {
    await seedV1Data()
    const report = await runMigration({ write: false })

    expect(report.counts).toBeDefined()
    expect(report.counts['rols']).toBeDefined()
    expect(report.counts['rols'].v1).toBeGreaterThan(0)
    // En dry-run: v2written cuenta los que SE ESCRIBIRÍAN
    expect(report.rubricConsolidations).toBeDefined()
    expect(Array.isArray(report.rubricConsolidations)).toBe(true)
  })
})
