// Recurso REST /api/v2/users sobre userRepository, con auth de v2.
//
// Endpoints:
//   GET    /     -> authenticate; lista por tenant (header 'tenant' o ?tenant=),
//                   con paginacion ?page=&size= (meta.pagination)
//   GET    /:id  -> authenticate; 200 | 404 NOT_FOUND
//   POST   /     -> authenticate + requirePermission('user:manage'); hashea password; 201
//   PUT    /:id  -> authenticate + requirePermission('user:manage'); 200 | 404
//   DELETE /:id  -> authenticate + requirePermission('user:manage'); 204
//
// El password NUNCA se expone: el toJSON del modelo lo elimina de la salida.
// Auditoría: POST/DELETE registran entrada en v2_audit_log (actor = token.id).

import { Request, Router } from 'express'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import userRepository from '../../../v2/repositories/user.repository'
import { NotFoundError, ValidationError } from '../../../utils/errors'
import { asyncHandler } from '../async-handler'
import { authenticate, requirePermission } from '../auth'
import { buildPaginationMeta, created, noContent, ok } from '../envelope'
import { paginationQuerySchema, resolvePagination } from '../pagination'
import { validate } from '../validate'
import auditService from '../../../v2/services/audit.service'

const router = Router()

const SALT_ROUNDS = 10

// --- Schemas ---

const idParamSchema = z.object({
  id: z.string()
})

const listQuerySchema = paginationQuerySchema.extend({
  tenant: z.string().optional()
})

const createBodySchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(1),
  rol: z.string().min(1),
  gadId: z.string().min(1),
  image: z.string().optional(),
  state: z.boolean().optional()
})

// PUT: reemplazo. password opcional; si viene, se re-hashea.
const updateBodySchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(1).optional(),
  rol: z.string().min(1).optional(),
  gadId: z.string().min(1).optional(),
  image: z.string().optional(),
  state: z.boolean().optional()
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
    const filter = { gadId: tenant }
    const pg = resolvePagination(query)

    if (!pg.enabled) {
      const items = await userRepository.findAll(filter, { populate: 'rol' })
      return ok(res, items)
    }

    const { items, total } = await userRepository.findPage(
      filter,
      pg.page,
      pg.size,
      { populate: 'rol' }
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
    const user = await userRepository.findByIdWithRol(req.params.id)
    if (!user) {
      throw new NotFoundError('user not found')
    }
    return ok(res, user)
  })
)

router.post(
  '/',
  authenticate,
  requirePermission('user:manage'),
  validate({ body: createBodySchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof createBodySchema>
    const passwordHash = await bcrypt.hash(body.password, SALT_ROUNDS)
    const now = new Date()
    // Mongoose castea strings de id a ObjectId en runtime; el cast unifica los
    // tipos sin alterar el comportamiento.
    const user = await userRepository.create({
      ...body,
      password: passwordHash,
      created: now,
      lastUpdate: now
    } as unknown as Parameters<typeof userRepository.create>[0])
    await auditService.record({
      actor: req.token!.id,
      action: 'user.create',
      entityType: 'user',
      entityId: (user as unknown as { _id: { toString(): string } })._id.toString()
    })
    return created(res, user)
  })
)

router.put(
  '/:id',
  authenticate,
  requirePermission('user:manage'),
  validate({ params: idParamSchema, body: updateBodySchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof updateBodySchema>
    const update: Record<string, unknown> = { ...body, lastUpdate: new Date() }
    if (body.password) {
      update.password = await bcrypt.hash(body.password, SALT_ROUNDS)
    }
    const updated = await userRepository.updateById(req.params.id, update)
    if (!updated) {
      throw new NotFoundError('user not found')
    }
    return ok(res, updated)
  })
)

router.delete(
  '/:id',
  authenticate,
  requirePermission('user:manage'),
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const deleted = await userRepository.deleteById(req.params.id)
    if (!deleted) {
      throw new NotFoundError('user not found')
    }
    await auditService.record({
      actor: req.token!.id,
      action: 'user.delete',
      entityType: 'user',
      entityId: req.params.id
    })
    return noContent(res)
  })
)

export = router
