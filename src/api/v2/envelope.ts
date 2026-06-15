// Helpers de envelope de respuesta para /api/v2.
//
// Contrato fijado (Fase 5):
//   Exito: { data: <recurso|array>, meta?: <opcional, p.ej. paginacion> }
//   Error: { error: { code, message, details? } }  (lo emite error-handler.ts)
//
// Estas funciones centralizan la forma de las respuestas de exito para que
// todos los recursos v2 sean consistentes.

import { Response } from 'express'

// Metadatos opcionales del envelope (paginacion u otros).
export interface Meta {
  pagination?: PaginationMeta
  [key: string]: unknown
}

export interface PaginationMeta {
  page: number
  size: number
  total: number
  totalPages: number
}

export interface SuccessEnvelope<T> {
  data: T
  meta?: Meta
}

// Respuesta de exito generica (200 por defecto).
export const ok = <T>(
  res: Response,
  data: T,
  meta?: Meta,
  status = 200
): Response => {
  const body: SuccessEnvelope<T> = meta ? { data, meta } : { data }
  return res.status(status).json(body)
}

// Recurso creado (201).
export const created = <T>(res: Response, data: T): Response =>
  ok(res, data, undefined, 201)

// Sin contenido (204): no lleva envelope.
export const noContent = (res: Response): Response => res.status(204).end()

// Construye el bloque meta.pagination a partir de page/size/total.
export const buildPaginationMeta = (
  page: number,
  size: number,
  total: number
): PaginationMeta => ({
  page,
  size,
  total,
  totalPages: size > 0 ? Math.ceil(total / size) : 0
})
