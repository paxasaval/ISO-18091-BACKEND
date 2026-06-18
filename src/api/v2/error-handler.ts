// Error handler de /api/v2.
//
// Mapea los errores a la forma de envelope { error: { code, message, details? } }
// con el status adecuado. Se monta AL FINAL del router de v2, asi que solo
// captura errores originados bajo /api/v2 y NO afecta el errorHandler legacy.
//
// Mapeo:
//   ZodError                 -> 400 VALIDATION_ERROR (+ details: issues)
//   AppError (y subclases)   -> statusCode + code propios
//   Mongoose CastError       -> 400 INVALID_ID
//   Mongoose ValidationError -> 400 VALIDATION_ERROR (+ details)
//   otro                     -> 500 INTERNAL

import { ErrorRequestHandler, NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import logger from '../../utils/logger'
import { AppError } from '../../utils/errors'

interface ErrorBody {
  error: {
    code: string
    message: string
    details?: unknown
  }
}

const send = (
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: unknown
): Response => {
  const body: ErrorBody = { error: { code, message } }
  if (details !== undefined) {
    body.error.details = details
  }
  return res.status(status).json(body)
}

// Forma minima de un Mongoose ValidationError (errors por path).
interface MongooseValidationErrorLike {
  name: string
  message: string
  errors?: Record<string, { message: string; path?: string }>
}

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  // next es obligatorio para que Express reconozca este como error handler.
  _next: NextFunction
): Response => {
  if (error instanceof ZodError) {
    return send(res, 400, 'VALIDATION_ERROR', 'validation error', error.issues)
  }

  if (error instanceof AppError) {
    return send(
      res,
      error.statusCode,
      error.code ?? 'ERROR',
      error.message,
      error.details
    )
  }

  // Errores de Mongoose: se detectan por name (no por instanceof, porque el
  // modelo legacy se importa sin tipos).
  if (error && typeof error === 'object' && 'name' in error) {
    const name = (error as { name: string }).name

    if (name === 'CastError') {
      const message = (error as { message?: string }).message ?? 'invalid id'
      logger.error(message)
      return send(res, 400, 'INVALID_ID', 'invalid id', undefined)
    }

    if (name === 'ValidationError') {
      const mErr = error as MongooseValidationErrorLike
      const details = mErr.errors
        ? Object.values(mErr.errors).map((e) => ({
          path: e.path,
          message: e.message
        }))
        : undefined
      return send(res, 400, 'VALIDATION_ERROR', mErr.message, details)
    }
  }

  const message =
    error instanceof Error ? error.message : 'internal server error'
  logger.error(message)
  return send(res, 500, 'INTERNAL', 'internal server error', undefined)
}

export default errorHandler
