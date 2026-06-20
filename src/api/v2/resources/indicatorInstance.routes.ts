// Recurso REST /api/v2/indicator-instances re-apuntado a la capa v2
// (IndicatorInstanceV2 / v2_indicator_instances).
//
// Endpoints:
//   GET    /                 -> lista. Filtros:
//                                ?period=<id>&tenant (header o query)
//                                ?period=&quadrant=<n>  -> por cuadrante
//                              Sin tenant: listado completo poblado.
//   GET    /summary          -> resumen por cuadrante (1..4) con conteos por
//                                calificacion (qualify_0..qualify_3).
//                                Requiere ?period=&tenant.
//   GET    /:id              -> 200 (populate profundo) | 404 NOT_FOUND
//   PUT    /:id              -> authenticate + requirePermission('indicator:create')
//                              200 | 404
//   DELETE /:id              -> authenticate + requirePermission('indicator:create')
//                              204 | 404
//
// Nombres limpios: gadId, indicatorInstanceId (referencia al catalogo Indicator).
// El FE consume qualification 0-3; no cambia la forma de respuesta.
// /summary se monta ANTES de /:id para no colisionar con el param route.

import mongoose from 'mongoose'
import { Request, Router } from 'express'
import { z } from 'zod'
import { indicatorInstanceRepository } from '../../../v2/repositories/indicator-instance.repository'
import { NotFoundError, UnauthorizedError, ValidationError } from '../../../utils/errors'
import { asyncHandler } from '../async-handler'
import { authenticate, requirePermission } from '../auth'
import { noContent, ok } from '../envelope'
import { objectId } from '../schemas'
import { validate } from '../validate'

const router = Router()

// --- Schemas ---

const idParamSchema = z.object({
  id: objectId
})

const listQuerySchema = z.object({
  tenant: z.string().optional(),
  period: z.string().optional(),
  quadrant: z.coerce.number().int().optional()
})

const summaryQuerySchema = z.object({
  tenant: z.string().optional(),
  period: z.string().min(1)
})

const updateBodySchema = z.object({
  qualification: z.number(),
  subindicators: z.array(objectId)
})

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
  validate({ query: listQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof listQuerySchema>
    const headerTenant = req.get('tenant') ?? undefined
    const tenant = headerTenant ?? query.tenant

    // Sin tenant ni filtros: listado completo poblado.
    if (!tenant && query.period === undefined && query.quadrant === undefined) {
      const items = await indicatorInstanceRepository.findAll(
        {},
        {
          populate: [
            { path: 'gadId' },
            { path: 'indicatorInstanceId' },
            { path: 'subindicators', model: 'SubindicatorV2' }
          ]
        }
      )
      return ok(res, items)
    }

    if (!tenant) {
      throw new ValidationError('tenant is required for filtered queries')
    }
    if (query.period === undefined) {
      throw new ValidationError('period is required for filtered queries')
    }

    // Obtener todas las instancias del GAD/periodo y filtrar/ordenar en memoria.
    // El campo ?period= es el valor del ano (year string) en v2, no un ObjectId.
    const items = (await indicatorInstanceRepository.findByYearAndTenant(
      query.period,
      tenant
    )) as unknown as Array<{
      indicatorInstanceId: { quadrant: number; number: number }
    }>

    const filtered =
      query.quadrant !== undefined
        ? items.filter((i) => i.indicatorInstanceId?.quadrant === query.quadrant)
        : items

    const sorted = [...filtered].sort(
      (a, b) => (a.indicatorInstanceId?.number ?? 0) - (b.indicatorInstanceId?.number ?? 0)
    )
    return ok(res, sorted)
  })
)

router.get(
  '/summary',
  validate({ query: summaryQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof summaryQuerySchema>
    const tenant = resolveTenant(req, query.tenant)
    const result = []
    for (let quadrant = 1; quadrant < 5; quadrant++) {
      const rows = (await indicatorInstanceRepository.aggregateByQuadrant(
        quadrant,
        query.period,
        tenant
      )) as Array<{
        indicatorInstanceId: { quadrantName: string }
        qualification: number
      }>
      result.push({
        quadrantName: rows[0]?.indicatorInstanceId?.quadrantName ?? '',
        qualify_0: rows.filter((r) => r.qualification === 0).length,
        qualify_1: rows.filter((r) => r.qualification === 1).length,
        qualify_2: rows.filter((r) => r.qualification === 2).length,
        qualify_3: rows.filter((r) => r.qualification === 3).length
      })
    }
    return ok(res, result)
  })
)

router.get(
  '/:id',
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const item = await indicatorInstanceRepository.findByIdDeep(req.params.id)
    if (!item) {
      throw new NotFoundError('indicator instance not found')
    }
    return ok(res, item)
  })
)

router.put(
  '/:id',
  authenticate,
  requirePermission('indicator:create'),
  validate({ params: idParamSchema, body: updateBodySchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof updateBodySchema>
    const userId = req.token?.id
    if (!userId) {
      throw new UnauthorizedError('token missing or invalid')
    }
    const updated = await indicatorInstanceRepository.updateById(req.params.id, {
      qualification: body.qualification,
      lastUpdate: new Date(),
      lastUpdateBy: new mongoose.Types.ObjectId(userId),
      subindicators: body.subindicators.map(
        (s) => new mongoose.Types.ObjectId(s)
      )
    })
    if (!updated) {
      throw new NotFoundError('indicator instance not found')
    }
    return ok(res, updated)
  })
)

router.delete(
  '/:id',
  authenticate,
  requirePermission('indicator:create'),
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const deleted = await indicatorInstanceRepository.deleteById(req.params.id)
    if (!deleted) {
      throw new NotFoundError('indicator instance not found')
    }
    return noContent(res)
  })
)

export = router
