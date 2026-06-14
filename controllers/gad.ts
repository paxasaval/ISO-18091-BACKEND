import { Router, Request, Response, NextFunction } from 'express'
import gadRepository from '../src/repositories/gad.repository'
import rolRepository from '../src/repositories/rol.repository'
import { getTokenFrom } from '../src/middleware/auth'
import jwt from 'jsonwebtoken'
import env from '../src/config/env'

const gadRouter = Router()

const ROL_USER = env.ROL_USER

gadRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const gad = await gadRepository.findAll({})
    res.status(200).json(gad)
  } catch (error) {
    next(error)
  }
})

gadRouter.get('/myWorkspace', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantID = String(req.header('tenant'))
    const gad = await gadRepository.findById(tenantID)
    res.status(200).json(gad)
  } catch (error) {
    next(error)
  }
})

gadRouter.get('/reportDefault', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const gadID = String(req.get('tenant'))
    const gadBD = await gadRepository.findByIdWithReportDefault(gadID)
    res.status(200).json(gadBD!.reportDefault)
  } catch (error) {
    next(error)
  }
})

gadRouter.get('/reports', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const gadID = String(req.get('tenant'))
    const gadBD = await gadRepository.findByIdWithReports(gadID)
    res.status(200).json(gadBD!.report)
  } catch (error) {
    next(error)
  }
})

gadRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Quirk legacy: NO se hace await sobre findById, se serializa la Query.
    const id = req.params.id
    const gad = gadRepository.findById(id)
    res.status(200).json(gad)
  } catch (error) {
    next(error)
  }
})

gadRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body
    if (body.name === undefined) {
      res.status(400).json({ error: 'name missing' })
    }
    const savedGad = await gadRepository.create({
      name: body.name,
      code: body.code,
      city: body.city,
      country: body.country,
      size: Number(body.size),
      staff: [],
      users: [],
      state: true,
      publishAuto: true
    })
    const savedAndFormattGad = savedGad.toJSON()
    res.status(200).json(savedAndFormattGad)
  } catch (error) {
    next(error)
  }
})

gadRouter.put('/newReport', async (req: Request, res: Response, next: NextFunction) => {
  try {
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
      } else if (rol.name === ROL_USER) {
        return res.status(401).json({ error: 'unauthorized rol' })
      }
    }
    // end-authorization
    const body = req.body
    if (body.source === undefined) {
      res.status(400).json({ error: 'source missing' })
    }
    const infoArray = body.info.map((info: unknown) => info)
    const savedReport = await gadRepository.createReport({
      source: body.source,
      period: body.period,
      info: infoArray
    })
    const gadID = String(req.get('tenant'))
    const savedGad = await gadRepository.addReportToGad(gadID, savedReport)
    const savedandFormattedGad = savedGad!.toJSON()
    res.status(200).json(savedandFormattedGad)
  } catch (error) {
    next(error)
  }
})

gadRouter.put('/updateConfig', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const gadID = String(req.get('tenant'))
    const saveGad = await gadRepository.updateConfig(
      gadID,
      req.body.reportDefault,
      Boolean(req.body.publishAuto)
    )
    res.status(200).json(saveGad!.toJSON())
  } catch (error) {
    next(error)
  }
})

gadRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body
    const id = req.params.id
    const gad = {
      name: body.name,
      code: body.code,
      city: body.city,
      country: body.country,
      size: Number(body.size),
      staff: [],
      users: [],
      state: true
    }
    const gadUpdate = await gadRepository.updateById(id, gad)
    const savedAndFormattGad = gadUpdate!.toJSON()
    res.status(200).json(savedAndFormattGad)
  } catch (error) {
    next(error)
  }
})

export = gadRouter
