// Schema y helpers de paginacion para /api/v2.
//
// REST limpio (independiente del legacy 0-indexado): `page` es 1-indexado y
// `size` acotado a [1, 100]. Si no se envian, NO se pagina (listado completo);
// el handler decide. Coerciona strings de query a numero con zod.

import { z } from 'zod'

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  size: z.coerce.number().int().min(1).max(100).optional()
})

export type PaginationQuery = z.infer<typeof paginationQuerySchema>

export interface ResolvedPagination {
  page: number
  size: number
  enabled: boolean
}

// Normaliza page/size. Si falta cualquiera, se aplican defaults (page 1,
// size 20) y se marca enabled=true cuando se pidio paginar (alguno presente).
export const resolvePagination = (
  query: PaginationQuery
): ResolvedPagination => {
  const enabled = query.page !== undefined || query.size !== undefined
  return {
    page: query.page ?? 1,
    size: query.size ?? 20,
    enabled
  }
}
