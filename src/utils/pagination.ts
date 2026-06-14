// Helper de paginacion centralizado.
//
// Replica EXACTAMENTE la logica hoy DUPLICADA en controllers/subindicator.js
// (lineas 12-17) y usada en controllers/indicatorInstance.js:
//   - size por defecto = 3
//   - limit = +size (numerico)
//   - offset = page * limit  (page base 0)
//
// Mantener esta semantica es necesario para no romper la compatibilidad v1 de
// los endpoints paginados (la forma de la respuesta de mongoose-paginate-v2
// depende de offset/limit).

export interface PaginationOptions {
  limit: number
  offset: number
}

// `page` y `size` llegan como query params de Express: string | undefined
// (o number si se invoca internamente). Se replica el casteo laxo del legacy.
export const getPagination = (
  page?: string | number,
  size?: string | number
): PaginationOptions => {
  const limit = size ? +size : 3
  const offset = page ? +page * limit : 0

  return { limit, offset }
}

export default getPagination
