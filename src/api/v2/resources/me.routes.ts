// Recurso REST /api/v2/me sobre la capa de datos v2
// (src/v2/repositories/user.repository -> coleccion v2_users).
//
// Resuelve el usuario autenticado (y su tenant/workspace gadId) a partir del
// token, evitando que el FE hardcodee el tenant en el login (resuelve HC#4).
//
// Endpoints:
//   GET / -> authenticate; usuario v2 (sin password) con rol/gad poblados.
//            401 UNAUTHORIZED sin token | 404 NOT_FOUND si el id no existe.

import { Router } from 'express'
import userRepository from '../../../v2/repositories/user.repository'
import { NotFoundError, UnauthorizedError } from '../../../utils/errors'
import { asyncHandler } from '../async-handler'
import { authenticate } from '../auth'
import { ok } from '../envelope'

const router = Router()

router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const decoded = req.token
    if (!decoded) {
      throw new UnauthorizedError('token missing or invalid')
    }

    const user = await userRepository.findById(decoded.id, {
      select: '-password',
      populate: ['rol', 'gadId']
    })
    if (!user) {
      throw new NotFoundError('user not found')
    }
    return ok(res, user)
  })
)

export = router
