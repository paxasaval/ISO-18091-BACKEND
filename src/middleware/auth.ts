import { Request, Response, NextFunction, RequestHandler } from 'express'
import jwt, { JwtPayload } from 'jsonwebtoken'
import env from '../config/env'
// Modelo Mongoose legacy en CommonJS sin tipos (checkJs:false) -> tipo any justificado.
import Rol from '../../models/rol'

// Payload firmado en controllers/login.js: { mail, name, rol, id }.
export interface TokenPayload extends JwtPayload {
  id: string
  rol: string
  mail?: string
  name?: string
}

// Extiende Express.Request para adjuntar el token decodificado.
declare global {
  namespace Express {
    interface Request {
      token?: TokenPayload
    }
  }
}

// Equivalente a utils/middleware.js lineas 44-50.
export const getTokenFrom = (req: Request): string | null => {
  const authorization = req.get('authorization')
  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    return authorization.substring(7)
  }
  return null
}

// Middleware de auth para v1 (cableado en Fase 4). FIEL al auth inline legacy
// (controllers/subindicator.js ~420-435) ejecutado dentro de try/catch que hace
// next(error) -> errorHandler (utils/middleware.js:24-42).
//
// Comportamiento observable identico al legacy:
//   - token ausente (null) o invalido/malformado -> jwt.verify lanza
//     JsonWebTokenError -> errorHandler -> 400 { error: 'invalid token' }
//   - token expirado -> TokenExpiredError -> errorHandler -> 401 { error: 'token expired' }
//
// No se captura el error: el throw sincrono de jwt.verify lo reenvia Express
// al errorHandler. NO unificar a 401 aqui (eso rompe compat v1).
export const requireAuth: RequestHandler = (req: Request, _res: Response, next: NextFunction) => {
  // getTokenFrom puede devolver null; igual que el legacy, se lo pasamos a
  // jwt.verify y dejamos que lance JsonWebTokenError -> 400 'invalid token'.
  const decodedToken = jwt.verify(getTokenFrom(req) as string, env.SECRET)
  req.token = decodedToken as TokenPayload
  return next()
}

// Middleware de auth NUEVO para /api/v2: version limpia con respuesta unificada.
// A diferencia de requireAuth (v1), responde SIEMPRE 401 { error: 'token missing
// or invalid' } ante token ausente, invalido o expirado. No depende del
// errorHandler legacy para mapear el status.
export const authenticate: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = getTokenFrom(req)
  if (!token) {
    return res.status(401).json({ error: 'token missing or invalid' })
  }

  let decodedToken: string | JwtPayload
  try {
    decodedToken = jwt.verify(token, env.SECRET)
  } catch {
    return res.status(401).json({ error: 'token missing or invalid' })
  }

  if (typeof decodedToken === 'string') {
    return res.status(401).json({ error: 'token missing or invalid' })
  }

  req.token = decodedToken as TokenPayload
  return next()
}

// Carga el Rol por id del token y rechaza con 401 si es el rol de usuario base.
// Mismos mensajes/status que los controladores actuales:
//   - !rol           -> 401 { error: 'rol missing or invalid' }
//   - rol.name === ROL_USER -> 401 { error: 'unauthorized rol' }
export const requireNotUser: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const decodedToken = req.token
  if (!decodedToken) {
    return res.status(401).json({ error: 'token missing or invalid' })
  }

  const rol = await Rol.findById(decodedToken.rol)
  if (!rol) {
    return res.status(401).json({ error: 'rol missing or invalid' })
  }
  if (rol.name === env.ROL_USER) {
    return res.status(401).json({ error: 'unauthorized rol' })
  }

  return next()
}

// Alias semantico: requiere un rol elevado (cualquiera distinto del rol base).
// Mismo comportamiento que requireNotUser.
export const requireElevatedRole = requireNotUser
