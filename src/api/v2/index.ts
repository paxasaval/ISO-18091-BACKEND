// Router raiz de /api/v2.
//
// Monta los recursos REST y, AL FINAL, el error-handler de v2. Asi los errores
// originados bajo /api/v2 salen siempre en formato envelope sin afectar el
// errorHandler legacy de app.js (que sigue manejando v1).
//
// Se exporta con `export =` para que app.js (CommonJS) lo consuma con require().
//
// Documentacion (publica, sin auth):
//   GET /api/v2/openapi.json  -> spec OpenAPI 3 (JSON)
//   GET /api/v2/docs          -> Swagger UI navegable

import { Router } from 'express'
import swaggerUi from 'swagger-ui-express'
import spec from './openapi'
import loginRouter from './resources/login.routes'
import indicatorsRouter from './resources/indicators.routes'
import usersRouter from './resources/users.routes'
import odsRouter from './resources/ods.routes'
import typeRouter from './resources/type.routes'
import rolRouter from './resources/rol.routes'
import meRouter from './resources/me.routes'
import commitRouter from './resources/commit.routes'
import valuationRouter from './resources/valuation.routes'
import notificationsRouter from './resources/notifications.routes'
import newsRouter from './resources/news.routes'
import rubricRouter from './resources/rubric.routes'
import sponsorsRouter from './resources/sponsors.routes'
import gadRouter from './resources/gad.routes'
import periodRouter from './resources/period.routes'
import characteristicRouter from './resources/characteristic.routes'
import subindicatorRouter from './resources/subindicator.routes'
import evidenceRouter from './resources/evidence.routes'
import indicatorInstanceRouter from './resources/indicatorInstance.routes'
import configRouter from './resources/config.routes'
import auditLogRouter from './resources/audit-log.routes'
import sourceDocumentsRouter from './resources/source-documents.routes'
import assessmentsRouter from './resources/assessments.routes'
import { errorHandler } from './error-handler'

const router = Router()

// --- Documentacion publica (sin auth) ---
// GET /api/v2/openapi.json -> spec OpenAPI 3 en JSON crudo.
router.get('/openapi.json', (_req, res) => {
  res.json(spec)
})

// GET /api/v2/docs -> Swagger UI.
// swaggerUi.serve es un array de middlewares; swaggerUi.setup devuelve el handler.
router.use('/docs', swaggerUi.serve, swaggerUi.setup(spec, {
  customSiteTitle: 'ISO 18091 API v2 — Docs'
}))

// Login v2 (PUBLICO): autentica contra v2_users por email. Se monta antes que
// el resto de recursos; no lleva auth.
router.use('/login', loginRouter)
router.use('/indicators', indicatorsRouter)
router.use('/users', usersRouter)
router.use('/ods', odsRouter)
// Catalogo de tipos: ruta canonica /types (plural REST) + alias /type por
// compatibilidad con consumidores existentes. Ambos montan el mismo router.
router.use('/types', typeRouter)
router.use('/type', typeRouter)
router.use('/rol', rolRouter)
router.use('/me', meRouter)
router.use('/commit', commitRouter)
router.use('/valuation', valuationRouter)
router.use('/notifications', notificationsRouter)
router.use('/news', newsRouter)
router.use('/rubric', rubricRouter)
router.use('/sponsors', sponsorsRouter)
router.use('/gad', gadRouter)
router.use('/periods', periodRouter)
router.use('/characteristics', characteristicRouter)
router.use('/subindicators', subindicatorRouter)
router.use('/evidences', evidenceRouter)
router.use('/indicator-instances', indicatorInstanceRouter)
router.use('/config', configRouter)
router.use('/audit-log', auditLogRouter)
router.use('/source-documents', sourceDocumentsRouter)
// Assessments de caracteristica: GET /subindicators/:subindicatorId/assessments
// y GET /subindicators/:subindicatorId/assessments/:characteristicId.
// Se monta bajo /subindicators para formar URLs REST semanticas sin tocar
// el recurso /subindicators existente (que sigue siendo legacy en Tema 5).
router.use('/subindicators/:subindicatorId/assessments', assessmentsRouter)

// Error handler de v2 AL FINAL: captura solo errores de este sub-router.
router.use(errorHandler)

export = router
