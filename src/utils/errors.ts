import { ErrorRequestHandler } from 'express'
import logger from './logger'

export class AppError extends Error {
  public readonly statusCode: number
  // Codigo de error legible para el envelope de /api/v2 ({ error: { code } }).
  // Opcional para no alterar el uso de AppError en v1.
  public readonly code?: string
  // Detalles opcionales adjuntables al envelope (p.ej. issues de zod).
  public readonly details?: unknown

  constructor(message: string, statusCode = 500, code?: string, details?: unknown) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'not found', details?: unknown) {
    super(message, 404, 'NOT_FOUND', details)
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'unauthorized', details?: unknown) {
    super(message, 401, 'UNAUTHORIZED', details)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'forbidden', details?: unknown) {
    super(message, 403, 'FORBIDDEN', details)
    this.name = 'ForbiddenError'
  }
}

export class ValidationError extends AppError {
  constructor(message = 'validation error', details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
  }
}

// Forma minima de un Mongoose CastError, para leer model.modelName.
interface CastErrorLike {
  name: string
  model?: { modelName: string }
}

// Replica EXACTA de utils/middleware.js (lineas 24-42).
export const errorHandler: ErrorRequestHandler = (error, request, response, next) => {
  logger.error(error.message)

  if (error.name === 'CastError') {
    const castError = error as CastErrorLike
    return response
      .status(400)
      .send({ error: `malformatted id by ${castError.model?.modelName}` })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  } else if (error.name === 'JsonWebTokenError') {
    return response.status(400).json({
      error: 'invalid token'
    })
  } else if (error.name === 'TokenExpiredError') {
    return response.status(401).json({
      error: 'token expired'
    })
  }

  next(error)
}
