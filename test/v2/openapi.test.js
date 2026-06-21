// Tests de documentacion OpenAPI de /api/v2 (Fase 6).
//
// Verifica:
//   GET /api/v2/openapi.json  -> 200 con openapi:'3...', paths no vacio,
//                                 recursos clave presentes.
//   GET /api/v2/docs          -> 200 con HTML de Swagger UI.

const supertest = require('supertest')
const app = require('../../app')
const db = require('../helpers/db')

const api = supertest(app)

beforeAll(async () => {
  await db.connect()
})
afterAll(async () => {
  await db.disconnect()
})

describe('GET /api/v2/openapi.json', () => {
  test('200 con campo openapi 3.x', async () => {
    const res = await api.get('/api/v2/openapi.json').expect(200)
    expect(res.body.openapi).toMatch(/^3\./)
  })

  test('paths no vacio', async () => {
    const res = await api.get('/api/v2/openapi.json').expect(200)
    expect(typeof res.body.paths).toBe('object')
    expect(Object.keys(res.body.paths).length).toBeGreaterThan(0)
  })

  test('incluye recurso /types', async () => {
    const res = await api.get('/api/v2/openapi.json').expect(200)
    expect(res.body.paths['/types']).toBeDefined()
  })

  test('incluye recurso /evidences', async () => {
    const res = await api.get('/api/v2/openapi.json').expect(200)
    expect(res.body.paths['/evidences']).toBeDefined()
  })

  test('incluye recurso /source-documents', async () => {
    const res = await api.get('/api/v2/openapi.json').expect(200)
    expect(res.body.paths['/source-documents']).toBeDefined()
  })

  test('incluye info, servers y components.securitySchemes.BearerAuth', async () => {
    const res = await api.get('/api/v2/openapi.json').expect(200)
    expect(res.body.info).toBeDefined()
    expect(Array.isArray(res.body.servers)).toBe(true)
    expect(res.body.components.securitySchemes.BearerAuth).toBeDefined()
  })

  test('ErrorEnvelope define los codigos de error canonicos', async () => {
    const res = await api.get('/api/v2/openapi.json').expect(200)
    const errorCodes =
      res.body.components.schemas.ErrorEnvelope.properties.error.properties.code.enum
    expect(errorCodes).toContain('VALIDATION_ERROR')
    expect(errorCodes).toContain('UNAUTHORIZED')
    expect(errorCodes).toContain('FORBIDDEN')
    expect(errorCodes).toContain('NOT_FOUND')
    expect(errorCodes).toContain('INVALID_ID')
    expect(errorCodes).toContain('INTERNAL')
  })

  test('PaginationMeta define page, size, total, totalPages', async () => {
    const res = await api.get('/api/v2/openapi.json').expect(200)
    const props = res.body.components.schemas.PaginationMeta.properties
    expect(props.page).toBeDefined()
    expect(props.size).toBeDefined()
    expect(props.total).toBeDefined()
    expect(props.totalPages).toBeDefined()
  })

  test('incluye recursos: /gad, /periods, /characteristics, /subindicators, /indicator-instances', async () => {
    const res = await api.get('/api/v2/openapi.json').expect(200)
    const paths = res.body.paths
    expect(paths['/gad']).toBeDefined()
    expect(paths['/periods']).toBeDefined()
    expect(paths['/characteristics']).toBeDefined()
    expect(paths['/subindicators']).toBeDefined()
    expect(paths['/indicator-instances']).toBeDefined()
  })

  test('incluye assessments anidados bajo /subindicators', async () => {
    const res = await api.get('/api/v2/openapi.json').expect(200)
    const paths = res.body.paths
    expect(paths['/subindicators/{subindicatorId}/assessments']).toBeDefined()
    expect(paths['/subindicators/{subindicatorId}/assessments/{characteristicId}']).toBeDefined()
  })
})

describe('GET /api/v2/docs', () => {
  test('200 con HTML de Swagger UI', async () => {
    const res = await api.get('/api/v2/docs/').expect(200)
    expect(res.headers['content-type']).toMatch(/html/)
    expect(res.text).toContain('swagger')
  })
})
