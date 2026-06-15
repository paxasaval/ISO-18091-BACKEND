// Helpers de seed para los modelos v2 (colecciones v2_*). Analogo a
// test/helpers/seed.js pero usando los modelos limpios de src/v2/models/* con
// los NOMBRES DE CAMPO LIMPIOS (email, gadId, typeId, valuations, etc.).
//
// Lo usan los tests de los recursos re-apuntados a la capa v2 (type, rol, me).
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

// Los modelos v2 estan en TypeScript; tsx/ts-jest los resuelve via require.
const Rol = require('../../src/v2/models/rol.model')
const User = require('../../src/v2/models/user.model')
const Gad = require('../../src/v2/models/gad.model')
const Type = require('../../src/v2/models/type.model')
const Characteristic = require('../../src/v2/models/characteristic.model')
const Valuation = require('../../src/v2/models/valuation.model')

// Devuelve el _id si recibe un documento, o el valor tal cual si ya es un id.
const idOf = (docOrId) => (docOrId && docOrId._id ? docOrId._id : docOrId)

// Firma un token con la misma forma que controllers/login.js: { id, rol, ... }.
// authenticate de v2 solo necesita { id, rol }; mail/name se incluyen por
// fidelidad al payload real.
const signToken = ({ id, rol, mail = 'seed-v2@test.com', name = 'Seed V2' }) =>
  jwt.sign({ id, rol, mail, name }, process.env.SECRET, { expiresIn: 60 * 60 })

const createRolV2 = (overrides = {}) =>
  new Rol({
    name: 'Administrador',
    description: 'rol administrador',
    code: 'admin',
    slug: 'administrador',
    order: 1,
    permissions: [],
    ...overrides
  }).save()

const createGadV2 = (overrides = {}) =>
  new Gad({
    name: 'GAD Test',
    code: 'GAD-001',
    city: 'Loja',
    country: 'Ecuador',
    size: 1,
    admin: [],
    staff: [],
    users: [],
    state: true,
    publishAuto: true,
    report: [],
    ...overrides
  }).save()

const createUserV2 = async (overrides = {}) => {
  const { rol: rolOv, gadId: gadOv, passwordPlain: pwOv, ...rest } = overrides
  const rol = rolOv || (await createRolV2())
  const gad = gadOv || (await createGadV2())
  const passwordPlain = pwOv || 'secret123'
  const passwordHash = await bcrypt.hash(passwordPlain, 10)
  const user = new User({
    name: 'Seed V2 User',
    email: `user-${Date.now()}-${Math.random()}@test.com`,
    created: new Date(),
    lastUpdate: new Date(),
    state: true,
    ...rest,
    password: passwordHash,
    rol: idOf(rol),
    gadId: idOf(gad)
  })
  const saved = await user.save()
  return { user: saved, rol, gad, passwordPlain }
}

const createValuationV2 = (overrides = {}) =>
  new Valuation({
    name: 'Valoracion Test',
    category: 'cat',
    maxValue: 5,
    slug: 'valoracion-test',
    order: 1,
    ...overrides
  }).save()

const createCharacteristicV2 = async (overrides = {}) => {
  const { valuations: valOv, ...rest } = overrides
  const valuations = valOv || [(await createValuationV2())._id]
  return new Characteristic({
    name: 'Caracteristica Test',
    group: 'g1',
    groupName: 'Grupo 1',
    isRequired: true,
    required: true,
    score: 5,
    tier: 1,
    unique: false,
    parts: [],
    allowedFormats: ['pdf'],
    slug: 'caracteristica-test',
    order: 1,
    ...rest,
    valuations
  }).save()
}

const createTypeV2 = async (overrides = {}) => {
  const { characteristics: chOv, ...rest } = overrides
  const characteristics = chOv || [(await createCharacteristicV2())._id]
  return new Type({
    name: 'Tipo Test',
    red: 'rojo',
    yellow: 'amarillo',
    green: 'verde',
    mandatory: true,
    slug: 'tipo-test',
    order: 1,
    ...rest,
    characteristics
  }).save()
}

module.exports = {
  signToken,
  createRolV2,
  createGadV2,
  createUserV2,
  createValuationV2,
  createCharacteristicV2,
  createTypeV2
}
