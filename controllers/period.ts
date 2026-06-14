import { Router, Request, Response, NextFunction } from 'express'
import mongoose from 'mongoose'
import periodRepository from '../src/repositories/period.repository'
import rolRepository from '../src/repositories/rol.repository'
import { getTokenFrom } from '../src/middleware/auth'
import jwt from 'jsonwebtoken'
import env from '../src/config/env'

const periodRouter = Router()

// DIVERGENCIA JUSTIFICADA: el legacy controllers/period.js compara contra
// process.env.ROL_ADMIN (valor 'Administrador'), NO contra utils/config.js.
// En src/config/env.ts, env.ROL_ADMIN esta mapeado a ROL_ADMIN_KEY (un ObjectId
// distinto), replicando utils/config.js. Usar env.ROL_ADMIN aqui romperia la
// compat v1 (el test de POST / con rol admin fallaria). Se preserva la lectura
// directa de process.env.ROL_ADMIN para mantener el comportamiento observable.
const ROL_ADMIN = process.env.ROL_ADMIN

periodRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenant = req.header('tenant')
    if (!tenant) {
      return res.status(400).json({ erro: 'tenat is nesesary' })
    }
    const period = await periodRepository.findByTenant(tenant)
    return res.status(200).json(period)
  } catch (error) {
    next(error)
  }
})

periodRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id
    const period = await periodRepository.findById(id)
    return res.status(200).json(period)
  } catch (error) {
    next(error)
  }
})

periodRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body
    if (body.period === undefined) {
      return res.status(400).json({ error: 'period is missing' })
    }
    // Authorizaction
    const token = getTokenFrom(req)
    const decodedToken = jwt.verify(token as string, env.SECRET)
    if (!token || !decodedToken) {
      return res.status(401).json({ error: 'token missing or invalid' })
    } else {
      const rolID = (decodedToken as { rol: string }).rol
      const user = new mongoose.Types.ObjectId((decodedToken as { id: string }).id)
      const rol = await rolRepository.findById(rolID)
      if (!rol) {
        return res.status(401).json({ error: 'rol missing or invalid' })
      } else if (rol.name === ROL_ADMIN) {
        return res.status(401).json({ error: 'unauthorized rol' })
      }
      // end-authorization
      const tenantID = req.header('tenant')
      const savePeriod = await periodRepository.create({
        year: body.period,
        gad: new mongoose.Types.ObjectId(tenantID),
        createdBy: user
      })
      const saveAndFormatPeriod = savePeriod.toJSON()
      return res.status(200).json(saveAndFormatPeriod)
    }
  } catch (error) {
    next(error)
  }
})

periodRouter.post('/new', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body
    if (req.header('tenant') === undefined) {
      return res.status(400).json({ error: 'tenant is nescesary' })
    }
    const tenantID = new mongoose.Types.ObjectId(req.header('tenant'))
    // Authorizaction
    const token = getTokenFrom(req)
    const decodedToken = jwt.verify(token as string, env.SECRET)
    if (!token || !decodedToken) {
      return res.status(401).json({ error: 'token missing or invalid' })
    } else {
      const rolID = (decodedToken as { rol: string }).rol
      const user = new mongoose.Types.ObjectId((decodedToken as { id: string }).id)
      const rol = await rolRepository.findById(rolID)
      if (!rol) {
        return res.status(401).json({ error: 'rol missing or invalid' })
      } else if (rol.name !== ROL_ADMIN) {
        return res.status(401).json({ error: 'unauthorized rol' })
      }
      // end-authorization

      if (body.period === undefined) {
        res.status(400).json({ error: 'period missing' })
      }
      // Requistos:body.period;header.tenant,header.token
      // Empieza la creacion del nuevo periodo y todo lo que conlleva
      const savedInstances = await periodRepository.createNewPeriodWithInstances(
        tenantID,
        user,
        body.period
      )
      return res.json(savedInstances)
    }
  } catch (error) {
    next(error)
  }
})

periodRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id
    // Authorizaction
    const token = getTokenFrom(req)
    const decodedToken = jwt.verify(token as string, env.SECRET)
    if (!token || !decodedToken) {
      return res.status(401).json({ error: 'token missing or invalid' })
    } else {
      const rolID = (decodedToken as { rol: string }).rol
      const rol = await rolRepository.findById(rolID)
      if (!rol) {
        return res.status(401).json({ error: 'rol missing or invalid' })
      } else if (rol.name === ROL_ADMIN) {
        return res.status(401).json({ error: 'unauthorized rol' })
      }
      // end-authorization
      await periodRepository.deleteById(id)
      return res.status(200).json({ message: 'period delete!' })
    }
  } catch (error) {
    next(error)
  }
})

export = periodRouter
