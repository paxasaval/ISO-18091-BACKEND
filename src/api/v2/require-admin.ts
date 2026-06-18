// Guard de rol ADMIN para /api/v2 basado en throw.
//
// requireElevatedRole (auth.ts) solo descarta el rol base (ROL_USER); algunos
// endpoints de dominio (calificacion/borrado de evidencia, edicion de
// indicator-instance) exigen exactamente el rol ADMIN. El legacy compara
// rol.name !== process.env.ROL_ADMIN ('Administrador'), distinto de
// env.ROL_ADMIN (mapeado a ROL_ADMIN_KEY, un ObjectId). Se replica esa
// INTENCION leyendo process.env.ROL_ADMIN, pero lanzando ForbiddenError (403)
// para que el error-handler de v2 lo envelopee de forma consistente.
//
// Debe usarse DESPUES de authenticate.

import { NextFunction, Request, Response } from 'express'
import { ForbiddenError, UnauthorizedError } from '../../utils/errors'
// El rol del token vive en la capa v2 (coleccion v2_rols), igual que auth.ts.
import Rol from '../../v2/models/rol.model'
import { asyncHandler } from './async-handler'

export const requireAdminRole = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const decoded = req.token
    if (!decoded) {
      throw new UnauthorizedError('token missing or invalid')
    }

    const rol = (await Rol.findById(decoded.rol)) as unknown as {
      name: string
    } | null
    if (!rol) {
      throw new ForbiddenError('rol missing or invalid')
    }
    if (rol.name !== process.env.ROL_ADMIN) {
      throw new ForbiddenError('unauthorized rol')
    }

    return next()
  }
)

export default requireAdminRole
