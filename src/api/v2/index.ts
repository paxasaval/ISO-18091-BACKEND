// Router raiz de /api/v2.
//
// Monta los recursos REST y, AL FINAL, el error-handler de v2. Asi los errores
// originados bajo /api/v2 salen siempre en formato envelope sin afectar el
// errorHandler legacy de app.js (que sigue manejando v1).
//
// Se exporta con `export =` para que app.js (CommonJS) lo consuma con require().

import { Router } from 'express'
import indicatorsRouter from './resources/indicators.routes'
import usersRouter from './resources/users.routes'
import odsRouter from './resources/ods.routes'
import typeRouter from './resources/type.routes'
import rolRouter from './resources/rol.routes'
import commitRouter from './resources/commit.routes'
import valuationRouter from './resources/valuation.routes'
import notificationsRouter from './resources/notifications.routes'
import newsRouter from './resources/news.routes'
import rubricRouter from './resources/rubric.routes'
import sponsorsRouter from './resources/sponsors.routes'
import { errorHandler } from './error-handler'

const router = Router()

router.use('/indicators', indicatorsRouter)
router.use('/users', usersRouter)
router.use('/ods', odsRouter)
router.use('/type', typeRouter)
router.use('/rol', rolRouter)
router.use('/commit', commitRouter)
router.use('/valuation', valuationRouter)
router.use('/notifications', notificationsRouter)
router.use('/news', newsRouter)
router.use('/rubric', rubricRouter)
router.use('/sponsors', sponsorsRouter)

// Error handler de v2 AL FINAL: captura solo errores de este sub-router.
router.use(errorHandler)

export = router
