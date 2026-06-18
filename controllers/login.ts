import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import env from '../src/config/env'
import userRepository from '../src/repositories/user.repository'

const loginRouter = Router()

loginRouter.post('/', async (req: Request, res: Response) => {
  const body = req.body
  const user = await userRepository.findByMail(body.mail)
  const passwordCorrect =
    user === null ? false : await bcrypt.compare(body.password, user.password)

  if (!(user && passwordCorrect)) {
    return res.status(401).json({
      error: 'invalid mail o password'
    })
  }
  const userForToken = {
    mail: user.mail,
    name: user.name,
    rol: user.rol,
    id: user._id
  }

  const token = jwt.sign(userForToken, env.SECRET, { expiresIn: 60 * 60 })
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT')
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, x-client-key, x-client-token, x-client-secret, Authorization'
  )
  return res
    .status(200)
    .send({ token, mail: user.mail, name: user.name, rol: user.rol, id: user.id })
})

export = loginRouter
