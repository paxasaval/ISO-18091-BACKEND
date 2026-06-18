// Helpers de seed: crean documentos validos por entidad segun los esquemas
// Mongoose. Usados por los tests de caracterizacion v1 para preparar estado.
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

const Rol = require('../../models/rol')
const User = require('../../models/users')
const Gad = require('../../models/gad')
const Period = require('../../models/period')
const Ods = require('../../models/ods')
const Indicator = require('../../models/indicator')
const IndicatorInstance = require('../../models/indicatorInstance')
const Type = require('../../models/type')
const Characteristic = require('../../models/characteristic')
const SubIndicator = require('../../models/subindicator')
const Evidence = require('../../models/evidence')
const Valuation = require('../../models/valuation')
const Commit = require('../../models/commit')
const Notify = require('../../models/notifications')
const News = require('../../models/news')
const Rubric = require('../../models/rubric')
const Sponsor = require('../../models/sponsors')

// Devuelve el _id si recibe un documento, o el valor tal cual si ya es un id.
const idOf = (docOrId) => (docOrId && docOrId._id ? docOrId._id : docOrId)

// Firma un token como lo hace controllers/login.js
const signToken = ({ id, rol, mail = 'seed@test.com', name = 'Seed User' }) =>
  jwt.sign({ id, rol, mail, name }, process.env.SECRET, { expiresIn: 60 * 60 })

const createRol = (overrides = {}) =>
  new Rol({
    name: 'Administrador',
    description: 'rol administrador',
    ...overrides
  }).save()

const createUser = async (overrides = {}) => {
  const { rol: rolOv, gadID: gadOv, passwordPlain: pwOv, ...rest } = overrides
  const rol = rolOv || (await createRol())
  const gad = gadOv || (await createGad())
  const passwordPlain = pwOv || 'secret123'
  const passwordHash = await bcrypt.hash(passwordPlain, 10)
  const user = new User({
    name: 'Seed User',
    mail: `user-${Date.now()}-${Math.random()}@test.com`,
    created: new Date(),
    lastUpdate: new Date(),
    state: true,
    ...rest,
    password: passwordHash,
    rol: idOf(rol),
    gadID: idOf(gad)
  })
  const saved = await user.save()
  return { user: saved, rol, gad, passwordPlain }
}

const createGad = (overrides = {}) =>
  new Gad({
    name: 'GAD Test',
    code: 'GAD-001',
    city: 'Loja',
    country: 'Ecuador',
    size: 1,
    staff: [],
    users: [],
    state: true,
    publishAuto: true,
    report: [],
    ...overrides
  }).save()

const createPeriod = async (overrides = {}) => {
  const { gad: gadOv, createdBy: byOv, ...rest } = overrides
  const gad = gadOv || (await createGad())
  const createdBy = byOv || (await createUser()).user._id
  return new Period({
    year: '2026',
    ...rest,
    gad: idOf(gad),
    createdBy: idOf(createdBy)
  }).save()
}

const createOds = (overrides = {}) =>
  new Ods({
    number: 1,
    name: 'Fin de la pobreza',
    img: 'ods1.png',
    ...overrides
  }).save()

const createIndicator = async (overrides = {}) => {
  const { ods: odsOv, ...rest } = overrides
  const ods = odsOv || [(await createOds())._id]
  return new Indicator({
    name: 'Indicador Test',
    description: 'descripcion',
    number: 1,
    quadrant: 1,
    quadrantName: 'Cuadrante 1',
    red: 'rojo',
    yellow: 'amarillo',
    green: 'verde',
    ...rest,
    ods
  }).save()
}

const createValuation = (overrides = {}) =>
  new Valuation({
    name: 'Valoracion Test',
    category: 'cat',
    maxValue: 5,
    ...overrides
  }).save()

const createCharacteristic = async (overrides = {}) => {
  const { valuation: valOv, ...rest } = overrides
  const valuation = valOv || [(await createValuation())._id]
  return new Characteristic({
    name: 'Caracteristica Test',
    type: 1,
    group: 'g1',
    groupName: 'Grupo 1',
    isRequired: true,
    required: true,
    score: 5,
    tier: 1,
    unique: false,
    parts: [],
    allowed_formats: ['pdf'],
    ...rest,
    valuation
  }).save()
}

const createType = async (overrides = {}) => {
  const { characteristics: chOv, ...rest } = overrides
  const characteristics = chOv || [(await createCharacteristic())._id]
  return new Type({
    name: 'Tipo Test',
    red: 'rojo',
    yellow: 'amarillo',
    green: 'verde',
    mandatory: true,
    ...rest,
    characteristics
  }).save()
}

const createIndicatorInstance = async (overrides = {}) => {
  const { gadID: gadOv, indicatorID: indOv, period: perOv, ...rest } = overrides
  const gad = gadOv || (await createGad())
  const indicator = indOv || (await createIndicator())
  const period = perOv || (await createPeriod({ gad }))
  return new IndicatorInstance({
    year: '2026',
    qualification: 0,
    create: new Date(),
    state: false,
    subindicators: [],
    ...rest,
    gadID: idOf(gad),
    indicatorID: idOf(indicator),
    period: idOf(period)
  }).save()
}

const createSubIndicator = async (overrides = {}) => {
  const { typeID: typeOv, indicadorID: indOv, createdBy: byOv, ...rest } =
    overrides
  const type = typeOv || (await createType())
  const instance = indOv || (await createIndicatorInstance())
  const createdBy = byOv || (await createUser()).user._id
  return new SubIndicator({
    name: 'Subindicador Test',
    requireCover: false,
    responsible: 'Administracion',
    qualification: 0,
    created: new Date(),
    lastUpdate: new Date(),
    state: false,
    commits: [],
    evidences: [],
    ...rest,
    typeID: idOf(type),
    indicadorID: idOf(instance),
    createdBy: idOf(createdBy)
  }).save()
}

const createEvidence = async (overrides = {}) => {
  const {
    characteristicID: chOv,
    subIndicatorID: subOv,
    author: authOv,
    ...rest
  } = overrides
  const characteristic = chOv || (await createCharacteristic())
  const sub = subOv || (await createSubIndicator())
  const author = authOv || (await createUser()).user._id
  return new Evidence({
    name: 'Evidencia Test',
    link: 'http://test/doc',
    note: 'nota',
    content: [],
    state: true,
    verified: false,
    qualification: 1,
    rubric: [],
    commits: [],
    ...rest,
    characteristicID: idOf(characteristic),
    subIndicatorID: idOf(sub),
    author: idOf(author)
  }).save()
}

const createCommit = async (overrides = {}) => {
  const { autor: autorOv, ...rest } = overrides
  const autor = autorOv || (await createUser()).user._id
  return new Commit({
    body: 'comentario',
    created: new Date(),
    lastUpdate: new Date(),
    ...rest,
    autor: idOf(autor)
  }).save()
}

const createNotify = (overrides = {}) =>
  new Notify({
    type: 1,
    content: 'notificacion test',
    itemType: 1,
    date: new Date(),
    state: 1,
    ...overrides
  }).save()

const createNews = async (overrides = {}) => {
  const { author: authOv, gad: gadOv, ...rest } = overrides
  const author = authOv || (await createUser()).user._id
  const gad = gadOv || (await createGad())
  return new News({
    image: 'news.png',
    title: 'Noticia Test',
    description: 'descripcion noticia',
    tag: ['tag1'],
    ...rest,
    author: idOf(author),
    gad: idOf(gad)
  }).save()
}

const createRubric = async (overrides = {}) => {
  const { valuation: valOv, evidence: evOv, ...rest } = overrides
  const valuation = valOv || (await createValuation())
  const evidence = evOv || (await createEvidence())
  return new Rubric({
    qualification: 1,
    ...rest,
    valuation: idOf(valuation),
    evidence: idOf(evidence)
  }).save()
}

const createSponsor = async (overrides = {}) => {
  const { gad: gadOv, ...rest } = overrides
  const gad = gadOv || (await createGad())
  return new Sponsor({
    name: 'Sponsor Test',
    description: 'descripcion sponsor',
    image: 'sponsor.png',
    state: true,
    ...rest,
    gad: idOf(gad)
  }).save()
}

module.exports = {
  signToken,
  createRol,
  createUser,
  createGad,
  createPeriod,
  createOds,
  createIndicator,
  createIndicatorInstance,
  createType,
  createCharacteristic,
  createSubIndicator,
  createEvidence,
  createValuation,
  createCommit,
  createNotify,
  createNews,
  createRubric,
  createSponsor
}
