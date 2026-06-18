// Recurso REST /api/v2/config: configuracion de presentacion compartida por el
// FE. De solo lectura.
//
// Endpoints:
//   GET /semaphore -> 200 { data: { scale, note } } con la escala de semaforo
//                     unica (HC#6). Los umbrales red/yellow/green viven en
//                     Type/Indicator (ver nota).

import { Router } from 'express'
import { SEMAPHORE_SCALE, SEMAPHORE_NOTE } from '../../../v2/config/semaphore'
import { ok } from '../envelope'

const router = Router()

router.get('/semaphore', (_req, res) => {
  return ok(res, { scale: SEMAPHORE_SCALE, note: SEMAPHORE_NOTE })
})

export = router
