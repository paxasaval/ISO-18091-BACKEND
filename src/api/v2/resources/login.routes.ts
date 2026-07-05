// Recurso /api/v2/login — autenticacion contra la capa v2 (coleccion v2_users).
//
// Espejo v2 del login legacy (controllers/login.ts) pero DESACOPLADO:
//   - busca el usuario en v2_users por `email` (v1 usaba `mail` en `users`).
//   - resuelve el `rol` contra v2_rols (el authenticate de v2 espera ese id).
//   - firma el JWT con { id, rol, name, email }; `id` y `rol` son los ids v2 que
//     consumen `authenticate`, `requirePermission` y `GET /api/v2/me`.
//
// Endpoint (PUBLICO, sin token):
//   POST /  { email, password } -> 200 { data: { token, user } }
//                                 | 401 UNAUTHORIZED (credenciales invalidas)
//                                 | 400 VALIDATION_ERROR (body invalido)
//
// El password NUNCA se devuelve: el objeto `user` de la respuesta se arma con
// campos explicitos (no se serializa el documento crudo).

import { Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import env from '../../../config/env'
import userRepository from '../../../v2/repositories/user.repository'
import { UnauthorizedError } from '../../../utils/errors'
import { asyncHandler } from '../async-handler'
import { ok } from '../envelope'
import { validate } from '../validate'

const router = Router()

const TOKEN_TTL_SECONDS = 60 * 60

const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

// El documento v2 trae `password` (select:true) y `_id`; se tipa el minimo
// necesario para comparar el hash y construir el token sin castear a any.
interface UserForLogin {
  _id: { toString(): string }
  name: string
  email: string
  password: string
  rol: { toString(): string }
}

router.post(
  '/',
  validate({ body: loginBodySchema }),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as z.infer<typeof loginBodySchema>

    const user = (await userRepository.findByEmail(
      email
    )) as unknown as UserForLogin | null

    const passwordCorrect =
      user === null ? false : await bcrypt.compare(password, user.password)

    if (!user || !passwordCorrect) {
      throw new UnauthorizedError('invalid email or password')
    }

    const id = user._id.toString()
    const rol = user.rol.toString()
    const token = jwt.sign(
      { id, rol, name: user.name, email: user.email },
      env.SECRET,
      { expiresIn: TOKEN_TTL_SECONDS }
    )

    return ok(res, {
      token,
      user: { id, name: user.name, email: user.email, rol }
    })
  })
)

export = router
