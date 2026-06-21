// Logger tipado equivalente a utils/logger.js.
// Replica el INTENT del legacy: silenciar el log informativo en entorno de test.
import env from '../config/env'

export const info = (...params: unknown[]): void => {
  if (env.NODE_ENV !== 'test') {
    console.log(...params)
  }
}

export const warn = (...params: unknown[]): void => {
  console.warn(...params)
}

export const error = (...params: unknown[]): void => {
  console.error(...params)
}

export default { info, warn, error }
