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
import { errorHandler } from './error-handler'

const router = Router()

router.use('/indicators', indicatorsRouter)
router.use('/users', usersRouter)

// Error handler de v2 AL FINAL: captura solo errores de este sub-router.
router.use(errorHandler)

export = router
