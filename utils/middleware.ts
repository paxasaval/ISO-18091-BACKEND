import { Request, Response, NextFunction } from 'express'
import logger from './logger'
import { errorHandler } from '../src/utils/errors'
import { getTokenFrom } from '../src/middleware/auth'

// Middleware HTTP de la app. La lógica de DOMINIO que antes vivía aquí
// (qualifySubindicator, updateIndicator, updateSubindicator[2], notify) se
// migró a src/services/* en la Fase 3 y los controladores ya la consumen desde
// ahí, por lo que se retiró de este archivo (era código muerto).

const requestLogger = (request: Request, _response: Response, next: NextFunction) => {
  logger.info('Method:', request.method)
  logger.info('Path:  ', request.path)
  logger.info('Body:  ', request.body)
  logger.info('Header:', request.header('tenant'))
  logger.info('---')
  next()
}

const unknownEndpoint = (_request: Request, response: Response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

export = {
  requestLogger,
  unknownEndpoint,
  errorHandler,
  getTokenFrom
}
