import { ErrorRequestHandler } from 'express'
import logger from './logger'

export class AppError extends Error {
  public readonly statusCode: number

  constructor(message: string, statusCode = 500) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'not found') {
    super(message, 404)
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'unauthorized') {
    super(message, 401)
    this.name = 'UnauthorizedError'
  }
}

export class ValidationError extends AppError {
  constructor(message = 'validation error') {
    super(message, 400)
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
