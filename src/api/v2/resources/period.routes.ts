// Recurso REST /api/v2/periods sobre periodRepository, con auth de v2.
//
// Endpoints:
//   GET    /          -> authenticate; lista por tenant (header 'tenant' o
//                        ?tenant=)
//   GET    /:id       -> authenticate; 200 | 404 NOT_FOUND
//   POST   /          -> authenticate + requireElevatedRole; crea el periodo y,
//                        si ?clone=true, clona instancias de indicadores +
//                        subindicadores (periodRepository
//                        .createNewPeriodWithInstances). 201.
//   DELETE /:id       -> authenticate + requireElevatedRole; 204 | 404
//
// El tenant identifica el GAD propietario; createdBy se toma del token. El
// clonado y la creacion del grafo se delegan al repositorio (no se reimplementa
// la logica de dominio).

import { Request, Router } from 'express'
import mongoose from 'mongoose'
import { z } from 'zod'
import periodRepository from '../../../v2/repositories/period.repository'
import { NotFoundError, UnauthorizedError, ValidationError } from '../../../utils/errors'
import { asyncHandler } from '../async-handler'
import { authenticate, requireElevatedRole } from '../auth'
import { buildPaginationMeta, created, noContent, ok } from '../envelope'
import { paginationQuerySchema, resolvePagination } from '../pagination'
import { validate } from '../validate'

const router = Router()

// --- Schemas ---

const idParamSchema = z.object({
  id: z.string()
})

const listQuerySchema = paginationQuerySchema.extend({
  tenant: z.string().optional()
})

const createQuerySchema = z.object({
  tenant: z.string().optional(),
  clone: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true')
})

const createBodySchema = z.object({
  year: z.string().min(1)
})

// Resuelve el tenant desde el header 'tenant' o el query ?tenant=.
const resolveTenant = (req: Request, queryTenant?: string): string => {
  const headerTenant = req.get('tenant') ?? undefined
  const tenant = headerTenant ?? queryTenant
  if (!tenant) {
    throw new ValidationError('tenant is required (header or query)')
  }
  return tenant
}

// --- Rutas ---

router.get(
  '/',
  authenticate,
  validate({ query: listQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof listQuerySchema>
    const tenant = resolveTenant(req, query.tenant)
    const pg = resolvePagination(query)
    const filter = { gad: new mongoose.Types.ObjectId(tenant) }

    if (!pg.enabled) {
      const items = await periodRepository.findAll(
        filter as Record<string, unknown>
      )
      return ok(res, items)
    }

    const { items, total } = await periodRepository.findPage(
      filter as Record<string, unknown>,
      pg.page,
      pg.size
    )
    return ok(res, items, {
      pagination: buildPaginationMeta(pg.page, pg.size, total)
    })
  })
)

router.get(
  '/:id',
  authenticate,
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const period = await periodRepository.findById(req.params.id)
    if (!period) {
      throw new NotFoundError('period not found')
    }
    return ok(res, period)
  })
)

router.post(
  '/',
  authenticate,
  requireElevatedRole,
  validate({ query: createQuerySchema, body: createBodySchema }),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof createQuerySchema>
    const body = req.body as z.infer<typeof createBodySchema>
    const tenant = resolveTenant(req, query.tenant)
    const userId = req.token?.id
    if (!userId) {
      throw new UnauthorizedError('token missing or invalid')
    }
    const tenantId = new mongoose.Types.ObjectId(tenant)
    const user = new mongoose.Types.ObjectId(userId)

    if (query.clone) {
      // Crea el periodo y clona las instancias de indicadores/subindicadores.
      const instances = await periodRepository.createNewPeriodWithInstances(
        tenantId,
        user,
        body.year
      )
      return created(res, instances)
    }

    const period = await periodRepository.create({
      year: body.year,
      gad: tenantId,
      createdBy: user
    } as unknown as Parameters<typeof periodRepository.create>[0])
    return created(res, period)
  })
)

router.delete(
  '/:id',
  authenticate,
  requireElevatedRole,
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const deleted = await periodRepository.deleteById(req.params.id)
    if (!deleted) {
      throw new NotFoundError('period not found')
    }
    return noContent(res)
  })
)

export = router
