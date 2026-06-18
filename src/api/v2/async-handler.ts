// Envuelve handlers async para reenviar errores rechazados a next().
//
// El paquete express-async-errors esta instalado pero NO se importa en la app,
// asi que Express 4 NO captura por si solo los rechazos de promesas. Este
// wrapper garantiza que cualquier throw/reject dentro de un handler v2 llegue
// al error-handler de v2 (sin tocar v1).

import { NextFunction, Request, RequestHandler, Response } from 'express'

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>

export const asyncHandler = (fn: AsyncRequestHandler): RequestHandler => {
  return (req, res, next) => {
    fn(req, res, next).catch(next)
  }
}

export default asyncHandler
