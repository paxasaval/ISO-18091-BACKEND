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
// El rol del token vive en la capa v2 (coleccion v2_rols): los usuarios v2
// referencian RolV2 y el recurso /api/v2/rol opera sobre este modelo.
import Rol from '../../v2/models/rol.model'
import { asyncHandler } from './async-handler'
// Permisos atomicos del catálogo v2.
import { PERM_PUBLIC_READ } from '../../v2/constants/permissions'

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
// NOTA: se mantiene para retrocompatibilidad con los recursos complejos
// (evidence, subindicator, indicatorInstance) que aun no se re-apuntan a v2.
// Preferir requirePermission para recursos nuevos.
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

// Guard de permiso atomico: verifica que el rol del token incluya TODOS los
// permisos indicados. Lanza ForbiddenError (403) si el rol no existe o si
// falta alguno. Debe usarse DESPUES de authenticate.
//
// Uso:
//   router.post('/', authenticate, requirePermission('catalog:manage'), handler)
//   router.put('/', authenticate, requirePermission('gad:config'), handler)
//
// Cuando se re-apunten evidence/subindicator a v2 (Temas 5/4) usar:
//   requirePermission('evidence:qualify')  -> calificador (≠ autor del body)
//   requirePermission('evidence:publish')  -> publicador
//   requirePermission('subindicator:create') -> responsable
// La regla author ≠ qualificationBy y responsibleUserIds se cablean en
// esos handlers, no aqui.
export const requirePermission = (...perms: string[]): RequestHandler =>
  asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    const decoded = req.token
    if (!decoded) {
      throw new UnauthorizedError('token missing or invalid')
    }

    const rol = await Rol.findById(decoded.rol)
    if (!rol) {
      throw new ForbiddenError('rol missing or invalid')
    }

    // public:read es el permiso mínimo; si el permiso solicitado es solo
    // public:read cualquier rol autenticado puede acceder.
    const rolPerms: string[] = rol.permissions ?? []
    const missing = perms.filter(
      (p) => p !== PERM_PUBLIC_READ && !rolPerms.includes(p)
    )
    if (missing.length > 0) {
      throw new ForbiddenError('missing permission')
    }

    return next()
  })
