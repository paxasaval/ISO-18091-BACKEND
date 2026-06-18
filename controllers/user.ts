import { Router, Request, Response, NextFunction } from 'express'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import userRepository from '../src/repositories/user.repository'
import rolRepository from '../src/repositories/rol.repository'

const userRouter = Router()

userRouter.get('/', async (req: Request, res: Response) => {
  if (req.header('tenant')) {
    const tenantID = String(req.header('tenant'))
    const users = await userRepository.findByTenant(tenantID)
    if (users.length > 0) {
      res.status(200).json(users)
    } else {
      res.status(200).json({ message: 'no users in worskpace' })
    }
  } else {
    res.status(400).json({ message: 'tenant is nessesary' })
  }
})

userRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  const tenantID = new mongoose.Types.ObjectId(req.header('tenant'))
  const body = req.body
  if (body.name === undefined) {
    res.status(400).json({ error: 'name missing' })
  }
  try {
    const saved = await userRepository.create({
      name: body.name,
      mail: body.mail,
      password: body.password,
      rol: new mongoose.Types.ObjectId(body.rol),
      created: new Date(),
      lastUpdate: new Date(),
      state: true,
      gadID: tenantID
    })
    res.json(saved.toJSON())
  } catch (error) {
    next(error)
  }
})

userRouter.post('/signUp', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(body.password, saltRounds)
    const tenantID = req.header('tenant')
    if (tenantID === undefined) {
      return res.status(400).json({ error: 'Need tenantID by workspace' })
    }
    const rol = await rolRepository.findById(body.rol)
    const saved = await userRepository.create({
      name: body.name,
      mail: body.mail,
      password: passwordHash,
      rol: rol?._id,
      created: new Date(),
      lastUpdate: new Date(),
      state: true,
      gadID: new mongoose.Types.ObjectId(tenantID)
    })
    return res.json(saved)
  } catch (error) {
    return next(error)
  }
})

userRouter.post('/password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body
    const user = await userRepository.findByMail(body.mail)
    const passwordCorrect =
      user === null ? false : await bcrypt.compare(body.password, user.password)
    if (passwordCorrect) {
      return res.status(200).json(true)
    } else {
      return res.status(200).json(false)
    }
  } catch (error) {
    return next(error)
  }
})

userRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await userRepository.findByIdWithRol(req.params.id)
    if (result) {
      res.json(result)
    } else {
      res.status(404).end()
    }
  } catch (error) {
    next(error)
  }
})

userRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await userRepository.deleteById(req.params.id)
    res.status(204).end()
  } catch (error) {
    next(error)
  }
})

userRouter.put('/newPassword', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Quirk legacy: esta ruta no tiene :id, por lo que id es undefined.
    const id = req.params.id
    const body = req.body
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(body.password, saltRounds)
    const tenantID = req.header('tenant')
    if (tenantID === undefined) {
      return res.status(400).json({ error: 'Need tenantID by workspace' })
    }
    const updateUser = await userRepository.updateById(id, { password: passwordHash })
    return res.json(updateUser)
  } catch (error) {
    return next(error)
  }
})

userRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id
    const body = req.body
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(body.password, saltRounds)
    const tenantID = req.header('tenant')
    if (tenantID === undefined) {
      return res.status(400).json({ error: 'Need tenantID by workspace' })
    }
    const updateUser = await userRepository.updateById(id, {
      name: body.name,
      mail: body.mail,
      password: passwordHash,
      rol: new mongoose.Types.ObjectId(body.rol),
      lastUpdate: new Date()
    })
    return res.json(updateUser)
  } catch (error) {
    return next(error)
  }
})

export = userRouter
