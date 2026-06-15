// Auth de /api/v2 basada en throw (no respuestas inline).
//
// A diferencia del auth de v1 (src/middleware/auth.ts), aqui los fallos LANZAN
// errores de dominio (UnauthorizedError/ForbiddenError) que el error-handler de
// v2 envelopea de forma consistente:
//   - token ausente / invalido / expirado -> 401 UNAUTHORIZED
//   - rol base (ROL_USER) o rol inexistente -> 403 FORBIDDEN
//
// Reutiliza getTokenFrom y env.SECRET de la capa v1.

import { NextFunction, Request, RequestHandler, Response } from 'express'
import jwt, { JwtPayload } from 'jsonwebtoken'
import env from '../../config/env'
import { getTokenFrom, TokenPayload } from '../../middleware/auth'
import { ForbiddenError, UnauthorizedError } from '../../utils/errors'
// Modelo Mongoose legacy en CommonJS sin tipos (checkJs:false) -> any justificado.
import Rol from '../../../models/rol'
import { asyncHandler } from './async-handler'

// Verifica el JWT y adjunta el payload a req.token. Lanza UnauthorizedError
// (401) ante token ausente, invalido, expirado o con payload no-objeto.
export const authenticate: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const token = getTokenFrom(req)
  if (!token) {
    throw new UnauthorizedError('token missing or invalid')
  }

  let decoded: string | JwtPayload
  try {
    decoded = jwt.verify(token, env.SECRET)
  } catch {
    throw new UnauthorizedError('token missing or invalid')
  }

  if (typeof decoded === 'string') {
    throw new UnauthorizedError('token missing or invalid')
  }

  req.token = decoded as TokenPayload
  return next()
}

// Guard de rol elevado: rechaza con 403 FORBIDDEN si el rol del token es el rol
// base (ROL_USER) o si no existe. Debe usarse DESPUES de authenticate.
export const requireElevatedRole: RequestHandler = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const decoded = req.token
    if (!decoded) {
      throw new UnauthorizedError('token missing or invalid')
    }

    const rol = await Rol.findById(decoded.rol)
    if (!rol) {
      throw new ForbiddenError('rol missing or invalid')
    }
    if (rol.name === env.ROL_USER) {
      throw new ForbiddenError('unauthorized rol')
    }

    return next()
  }
)
