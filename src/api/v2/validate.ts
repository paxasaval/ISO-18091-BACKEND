// Middleware de validacion con zod para /api/v2.
//
// Valida body/query/params contra los schemas provistos. Ante fallo, LANZA un
// ZodError que el error-handler de v2 mapea a 400 VALIDATION_ERROR con los
// issues en `details`. Los valores parseados (con coerciones/defaults aplicados)
// se reescriben sobre req para que los handlers reciban datos ya saneados.

import { NextFunction, Request, RequestHandler, Response } from 'express'
import { ZodType } from 'zod'

export interface ValidationSchemas {
  body?: ZodType
  query?: ZodType
  params?: ZodType
}

export const validate = (schemas: ValidationSchemas): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (schemas.params) {
      req.params = schemas.params.parse(req.params) as typeof req.params
    }
    if (schemas.query) {
      // req.query es de solo lectura en algunas versiones; reasignamos via cast.
      const parsed = schemas.query.parse(req.query)
      Object.defineProperty(req, 'query', { value: parsed, configurable: true })
    }
    if (schemas.body) {
      req.body = schemas.body.parse(req.body)
    }
    return next()
  }
}

export default validate
